"use client";

import Skeleton from "@/components/skeleton";
import { ArrowDownCircleIcon, ArrowUpCircleIcon } from "@heroicons/react/20/solid";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const host = 'thermo-main.jfep7z3w9l.viam.cloud';

// MEASURED VALUES:
// 180 servo angle maps to -90° rotation for UI. @ 56 F°
// 10 servo angle maps to 50° rotation for UI. 80 F°

// Converts the servo angle to a rotation in degrees for the UI to display
const angleToRotation = (angle: number) => {
  return (angle - 10) * (-90 - 50) / (180 - 10) + 50;
};

// Converts the servo angle to a temperature in °F
const angleToTemperature = (angle: number) => {
  return (angle - 10) * (56 - 80) / (180 - 10) + 80;
};

export default function Dial({ apiKey, apiKeyId }: { apiKey: string, apiKeyId: string; }) {
  const queryClient = useQueryClient();

  // Load up the thermoDial servo such we can interact with it
  const { isLoading, data: thermoDial, refetch, isError: isRobotError } = useQuery({
    queryKey: ['robot'],
    queryFn:
      async () => {
        // Lazy load the VIAM library since it needs 'window' to be defined
        const VIAM = await import('@viamrobotics/sdk');
        const robot = await VIAM.createRobotClient({
          host,
          credential: {
            type: 'api-key',
            payload: apiKey,
          },
          authEntity: apiKeyId,
          signalingAddress: 'https://app.viam.com:443',
        });
        return new VIAM.ServoClient(robot, 'thermo-dial');
      },
    enabled: false,
  });

  // Query to load the current angle of the servo
  const { data: angle, isError: isDialError } = useQuery({
    queryKey: ['robot', 'position'], queryFn: async () => {
      return await thermoDial?.getPosition();
    }, enabled: !!thermoDial
  });

  // Mutation to move the servo to a new angle
  const dialAngle = useMutation({
    mutationFn: async (angle: number) => {
      await thermoDial?.move(Math.min(Math.max(10, angle), 180));
      queryClient.invalidateQueries({ queryKey: ['robot', 'position'] });
    }
  });

  // We need to wait for the window to initialize before we can load the robot
  useEffect(() => {
    refetch();
  }, [refetch]);

  if (isRobotError || isDialError) {
    return (
      <h1>
        An unexpected error occurred. Please try again later or verify API key.
      </h1>
    );
  }

  if (isLoading || angle === undefined) {
    return <Skeleton />;
  }

  return (
    <div>
      {/* Thermostat dial visualization */}
      <svg className="bg-black bg-opacity-50" viewBox="0 0 520 750" fill="none" xmlns="http://www.w3.org/2000/svg">
        <text x="52%" y="15%" dominantBaseline="middle" textAnchor="middle" fill="white" fontSize="4rem">
          {Math.round(angleToTemperature(angle))}°
        </text>
        <g className="transition-[transform] duration-1000" transform={`rotate(${angleToRotation(angle ?? 95)} 260 487)`}>
          <DialPaths />
        </g>
        <rect x="1" y="1" width="518" height="748" rx="34" stroke="white" strokeWidth="2" />
        <circle cx="259.5" cy="225.5" r="7.5" fill="#D9D9D9" />
      </svg>

      {/* Adjust temperature buttons */}
      <div className="flex flex-row gap-16 justify-center pt-4">
        <button onClick={() => dialAngle.mutate(angle + 10)}>
          <ArrowDownCircleIcon height={64} width={64} className="text-[#7EC8E3]/75"></ArrowDownCircleIcon>
        </button>
        <button onClick={() => dialAngle.mutate(angle - 10)}>
          <ArrowUpCircleIcon height={64} width={64} className="text-[#FF6961]/75"></ArrowUpCircleIcon>
        </button>
      </div>
    </div>
  );
}

// SVG paths for the thermostat dial
const DialPaths = () => {
  return (
    <>
      <path d="M494 487.5C494 617.011 389.011 722 259.5 722C129.989 722 25 617.011 25 487.5C25 357.989 129.989 253 259.5 253C389.011 253 494 357.989 494 487.5Z" stroke="white" strokeWidth="2" />
      <path d="M441.929 482.368C441.967 483.732 441.99 485.099 441.997 486.471L441.497 486.474C441.499 486.816 441.5 487.158 441.5 487.5C441.5 487.842 441.499 488.184 441.497 488.526L441.997 488.529C441.982 491.272 441.906 494 441.771 496.713L441.272 496.688C441.17 498.738 441.034 500.779 440.865 502.811L441.363 502.853C441.25 504.214 441.122 505.57 440.979 506.923L440.481 506.87C440.41 507.55 440.334 508.228 440.255 508.906L440.751 508.964C440.432 511.686 440.053 514.389 439.616 517.073L439.123 516.992C438.793 519.013 438.431 521.022 438.036 523.02L438.526 523.117C438.261 524.46 437.98 525.797 437.686 527.129L437.197 527.02C437.05 527.686 436.899 528.35 436.744 529.013L437.231 529.126C436.609 531.793 435.929 534.438 435.191 537.058L434.71 536.923C434.155 538.891 433.569 540.846 432.951 542.787L433.427 542.939C433.012 544.242 432.583 545.539 432.139 546.83L431.666 546.667C431.445 547.311 431.221 547.953 430.993 548.593L431.464 548.761C430.545 551.339 429.57 553.89 428.541 556.413L428.078 556.224C427.305 558.118 426.501 559.996 425.667 561.857L426.123 562.061C425.565 563.308 424.993 564.546 424.407 565.777L423.956 565.563C423.663 566.178 423.368 566.791 423.068 567.402L423.518 567.622C422.316 570.078 421.06 572.503 419.753 574.895L419.314 574.656C418.333 576.45 417.323 578.226 416.285 579.983L416.715 580.237C416.02 581.413 415.312 582.58 414.592 583.739L414.167 583.475C413.807 584.053 413.445 584.63 413.079 585.204L413.5 585.472C412.031 587.777 410.512 590.046 408.944 592.278L408.534 591.991C407.36 593.663 406.159 595.314 404.93 596.944L405.329 597.245C404.507 598.335 403.673 599.417 402.827 600.488L402.435 600.178C402.013 600.713 401.588 601.245 401.161 601.774L401.549 602.088C399.833 604.213 398.07 606.299 396.262 608.344L395.887 608.012C394.534 609.543 393.156 611.05 391.753 612.533L392.116 612.877C391.178 613.869 390.229 614.85 389.269 615.821L388.913 615.469C388.435 615.953 387.953 616.435 387.469 616.913L387.821 617.269C385.88 619.189 383.895 621.065 381.87 622.897L381.535 622.526C380.02 623.896 378.483 625.24 376.923 626.559L377.245 626.941C376.203 627.822 375.15 628.692 374.088 629.55L373.774 629.161C373.245 629.588 372.713 630.013 372.178 630.435L372.488 630.827C370.346 632.518 368.165 634.162 365.948 635.757L365.656 635.351C363.998 636.543 362.32 637.708 360.622 638.845L360.9 639.261C359.766 640.02 358.624 640.766 357.472 641.5L357.204 641.079C356.63 641.445 356.053 641.807 355.475 642.167L355.739 642.592C353.423 644.032 351.072 645.422 348.688 646.759L348.444 646.323C346.665 647.322 344.867 648.291 343.052 649.231L343.282 649.675C342.07 650.302 340.85 650.917 339.622 651.518L339.402 651.068C338.791 651.368 338.178 651.663 337.563 651.956L337.777 652.407C335.315 653.578 332.823 654.695 330.302 655.758L330.108 655.297C328.229 656.088 326.335 656.849 324.426 657.578L324.604 658.045C323.33 658.532 322.049 659.005 320.761 659.464L320.593 658.993C319.953 659.221 319.311 659.445 318.667 659.666L318.83 660.139C316.254 661.024 313.652 661.853 311.025 662.625L310.885 662.145C308.927 662.72 306.956 663.263 304.972 663.773L305.097 664.258C303.779 664.597 302.456 664.921 301.126 665.231L301.013 664.744C300.35 664.899 299.686 665.05 299.02 665.197L299.129 665.686C296.472 666.274 293.794 666.804 291.095 667.275L291.009 666.782C289.002 667.133 286.984 667.45 284.956 667.734L285.025 668.229C283.676 668.418 282.322 668.592 280.964 668.751L280.906 668.255C280.228 668.334 279.55 668.41 278.87 668.481L278.923 668.979C276.221 669.265 273.501 669.491 270.764 669.658L270.734 669.159C268.704 669.283 266.666 669.373 264.618 669.429L264.632 669.929C263.268 669.967 261.901 669.99 260.529 669.997L260.526 669.497C260.184 669.499 259.842 669.5 259.5 669.5C259.158 669.5 258.816 669.499 258.474 669.497L258.471 669.997C255.728 669.982 253 669.906 250.287 669.771L250.312 669.272C248.262 669.17 246.221 669.034 244.189 668.865L244.147 669.363C242.786 669.25 241.43 669.122 240.077 668.979L240.13 668.481C239.45 668.41 238.772 668.334 238.094 668.255L238.036 668.751C235.314 668.432 232.611 668.053 229.927 667.616L230.008 667.123C227.987 666.793 225.978 666.431 223.98 666.036L223.883 666.526C222.54 666.261 221.203 665.98 219.871 665.686L219.98 665.197C219.314 665.05 218.65 664.899 217.987 664.744L217.874 665.231C215.207 664.609 212.562 663.929 209.942 663.191L210.077 662.71C208.109 662.155 206.154 661.569 204.213 660.951L204.061 661.427C202.758 661.012 201.461 660.583 200.17 660.139L200.333 659.666C199.689 659.445 199.047 659.221 198.407 658.993L198.239 659.464C195.661 658.545 193.11 657.57 190.587 656.541L190.776 656.078C188.882 655.305 187.004 654.501 185.143 653.667L184.939 654.123C183.692 653.565 182.454 652.993 181.223 652.407L181.437 651.956C180.822 651.663 180.209 651.368 179.598 651.068L179.378 651.518C176.922 650.316 174.497 649.06 172.105 647.753L172.344 647.314C170.55 646.333 168.774 645.323 167.017 644.285L166.763 644.715C165.587 644.02 164.42 643.312 163.261 642.592L163.525 642.167C162.947 641.807 162.37 641.445 161.796 641.079L161.528 641.5C159.223 640.031 156.954 638.512 154.722 636.944L155.009 636.534C153.337 635.36 151.686 634.159 150.056 632.93L149.755 633.329C148.665 632.507 147.583 631.673 146.512 630.827L146.822 630.435C146.287 630.013 145.755 629.588 145.226 629.161L144.912 629.549C142.787 627.833 140.701 626.07 138.656 624.262L138.988 623.887C137.457 622.534 135.95 621.156 134.467 619.753L134.123 620.116C133.131 619.178 132.15 618.229 131.179 617.269L131.531 616.913C131.047 616.435 130.565 615.953 130.087 615.469L129.731 615.821C127.811 613.88 125.935 611.895 124.103 609.87L124.474 609.535C123.104 608.02 121.76 606.483 120.441 604.923L120.059 605.245C119.178 604.203 118.308 603.15 117.45 602.088L117.839 601.774C117.412 601.245 116.987 600.713 116.565 600.178L116.173 600.488C114.482 598.346 112.838 596.165 111.243 593.948L111.649 593.656C110.457 591.998 109.292 590.32 108.155 588.622L107.739 588.9C106.98 587.766 106.234 586.624 105.5 585.472L105.921 585.204C105.555 584.63 105.193 584.053 104.833 583.475L104.408 583.739C102.968 581.423 101.578 579.072 100.24 576.688L100.677 576.444C99.6781 574.665 98.7088 572.867 97.7691 571.052L97.325 571.282C96.6976 570.07 96.0833 568.85 95.4824 567.622L95.9315 567.402C95.6324 566.791 95.3366 566.178 95.0441 565.563L94.5926 565.777C93.4218 563.315 92.3046 560.823 91.2424 558.302L91.7031 558.108C90.9119 556.229 90.1512 554.335 89.4217 552.426L88.9547 552.604C88.4679 551.33 87.9951 550.049 87.5363 548.761L88.0073 548.593C87.7792 547.953 87.5546 547.311 87.3335 546.667L86.8607 546.83C85.9756 544.254 85.1465 541.652 84.375 539.025L84.8547 538.885C84.2798 536.927 83.7369 534.956 83.2265 532.972L82.7423 533.097C82.4033 531.779 82.0788 530.456 81.7687 529.126L82.2556 529.013C82.101 528.35 81.95 527.686 81.8027 527.02L81.3145 527.129C80.7263 524.472 80.196 521.794 79.725 519.095L80.2176 519.009C79.8673 517.002 79.55 514.984 79.266 512.956L78.7709 513.025C78.582 511.676 78.408 510.322 78.2489 508.964L78.7455 508.906C78.6661 508.228 78.5905 507.55 78.5186 506.87L78.0214 506.923C77.7355 504.22 77.5086 501.501 77.342 498.764L77.841 498.734C77.7174 496.704 77.6271 494.666 77.5706 492.618L77.0708 492.632C77.0331 491.268 77.0104 489.901 77.0028 488.529L77.5028 488.526C77.5009 488.184 77.5 487.842 77.5 487.5C77.5 487.158 77.5009 486.816 77.5028 486.474L77.0028 486.471C77.018 483.728 77.0936 481 77.2285 478.287L77.7279 478.312C77.8298 476.262 77.9657 474.221 78.1349 472.189L77.6366 472.147C77.75 470.786 77.8783 469.43 78.0214 468.077L78.5186 468.13C78.5905 467.45 78.6661 466.772 78.7455 466.094L78.2489 466.036C78.5677 463.314 78.9465 460.611 79.3838 457.927L79.8773 458.008C80.2065 455.987 80.569 453.978 80.9642 451.98L80.4737 451.883C80.7393 450.54 81.0196 449.203 81.3145 447.871L81.8027 447.98C81.95 447.314 82.101 446.65 82.2556 445.987L81.7687 445.874C82.3908 443.207 83.0715 440.562 83.8092 437.942L84.2905 438.077C84.8446 436.109 85.4311 434.154 86.0492 432.213L85.5728 432.061C85.9879 430.758 86.4172 429.461 86.8607 428.17L87.3335 428.333C87.5546 427.689 87.7792 427.047 88.0073 426.407L87.5363 426.239C88.4548 423.661 89.4295 421.11 90.4592 418.587L90.9221 418.776C91.6949 416.882 92.4987 415.004 93.3328 413.143L92.8765 412.939C93.435 411.692 94.0071 410.454 94.5926 409.223L95.0441 409.437C95.3366 408.822 95.6324 408.209 95.9315 407.598L95.4824 407.378C96.6844 404.922 97.9399 402.497 99.2474 400.105L99.6862 400.344C100.667 398.55 101.677 396.774 102.715 395.017L102.285 394.763C102.98 393.587 103.688 392.42 104.408 391.261L104.833 391.525C105.193 390.947 105.555 390.37 105.921 389.796L105.5 389.528C106.969 387.223 108.488 384.954 110.056 382.722L110.466 383.009C111.64 381.337 112.841 379.686 114.07 378.056L113.671 377.755C114.493 376.665 115.327 375.583 116.173 374.512L116.565 374.822C116.987 374.287 117.412 373.755 117.839 373.226L117.451 372.912C119.167 370.787 120.93 368.701 122.738 366.656L123.113 366.988C124.466 365.457 125.844 363.95 127.247 362.467L126.884 362.123C127.822 361.131 128.771 360.15 129.731 359.179L130.087 359.531C130.565 359.047 131.047 358.565 131.531 358.087L131.179 357.731C133.12 355.811 135.105 353.935 137.13 352.103L137.465 352.474C138.98 351.104 140.517 349.76 142.077 348.441L141.755 348.059C142.797 347.178 143.85 346.308 144.912 345.45L145.226 345.839C145.755 345.412 146.287 344.987 146.822 344.565L146.512 344.173C148.654 342.482 150.834 340.838 153.052 339.243L153.344 339.649C155.002 338.457 156.68 337.292 158.378 336.155L158.1 335.739C159.234 334.98 160.376 334.234 161.528 333.5L161.796 333.921C162.37 333.555 162.947 333.193 163.525 332.833L163.261 332.408C165.577 330.968 167.928 329.578 170.312 328.24L170.556 328.677C172.335 327.678 174.133 326.709 175.948 325.769L175.718 325.325C176.93 324.698 178.15 324.083 179.378 323.482L179.598 323.932C180.209 323.632 180.822 323.337 181.437 323.044L181.223 322.593C183.685 321.422 186.177 320.305 188.698 319.242L188.892 319.703C190.771 318.912 192.665 318.151 194.574 317.422L194.396 316.955C195.67 316.468 196.951 315.995 198.239 315.536L198.407 316.007C199.047 315.779 199.689 315.555 200.333 315.334L200.17 314.861C202.746 313.976 205.348 313.147 207.975 312.375L208.115 312.855C210.073 312.28 212.044 311.737 214.028 311.227L213.903 310.742C215.221 310.403 216.544 310.079 217.874 309.769L217.987 310.256C218.65 310.101 219.314 309.95 219.98 309.803L219.871 309.314C222.528 308.726 225.206 308.196 227.905 307.725L227.991 308.218C229.998 307.867 232.016 307.55 234.044 307.266L233.975 306.771C235.324 306.582 236.678 306.408 238.036 306.249L238.094 306.745C238.772 306.666 239.45 306.59 240.13 306.519L240.077 306.021C242.779 305.735 245.499 305.509 248.236 305.342L248.266 305.841C250.296 305.717 252.334 305.627 254.382 305.571L254.368 305.071C255.732 305.033 257.099 305.01 258.471 305.003L258.474 305.503C258.816 305.501 259.158 305.5 259.5 305.5C259.842 305.5 260.184 305.501 260.526 305.503L260.529 305.003C263.272 305.018 266 305.094 268.713 305.229L268.688 305.728C270.738 305.83 272.779 305.966 274.811 306.135L274.853 305.637C276.214 305.75 277.57 305.878 278.923 306.021L278.87 306.519C279.55 306.59 280.228 306.666 280.906 306.745L280.964 306.249C283.686 306.568 286.389 306.946 289.073 307.384L288.992 307.877C291.013 308.207 293.022 308.569 295.02 308.964L295.117 308.474C296.46 308.739 297.797 309.02 299.129 309.314L299.02 309.803C299.686 309.95 300.35 310.101 301.013 310.256L301.126 309.769C303.793 310.391 306.438 311.071 309.058 311.809L308.923 312.29C310.891 312.845 312.846 313.431 314.787 314.049L314.939 313.573C316.242 313.988 317.539 314.417 318.83 314.861L318.667 315.334C319.311 315.555 319.953 315.779 320.593 316.007L320.761 315.536C323.339 316.455 325.89 317.43 328.413 318.459L328.224 318.922C330.118 319.695 331.996 320.499 333.857 321.333L334.061 320.877C335.308 321.435 336.546 322.007 337.777 322.593L337.563 323.044C338.178 323.337 338.791 323.632 339.402 323.932L339.622 323.482C342.078 324.684 344.503 325.94 346.895 327.247L346.656 327.686C348.45 328.667 350.226 329.677 351.983 330.715L352.237 330.285C353.413 330.98 354.58 331.688 355.739 332.408L355.475 332.833C356.053 333.193 356.63 333.555 357.204 333.921L357.472 333.5C359.777 334.969 362.046 336.488 364.278 338.056L363.991 338.466C365.663 339.64 367.314 340.841 368.944 342.07L369.245 341.671C370.335 342.493 371.417 343.327 372.488 344.173L372.178 344.565C372.713 344.987 373.245 345.412 373.774 345.839L374.088 345.45C376.213 347.167 378.299 348.93 380.344 350.738L380.012 351.113C381.543 352.466 383.05 353.844 384.533 355.247L384.877 354.884C385.869 355.822 386.85 356.771 387.821 357.731L387.469 358.087C387.953 358.565 388.435 359.047 388.913 359.531L389.269 359.179C391.189 361.12 393.065 363.105 394.897 365.13L394.526 365.465C395.896 366.98 397.24 368.517 398.559 370.077L398.941 369.755C399.822 370.797 400.692 371.85 401.55 372.912L401.161 373.226C401.588 373.755 402.013 374.287 402.435 374.822L402.827 374.512C404.518 376.654 406.162 378.834 407.757 381.052L407.351 381.344C408.543 383.002 409.708 384.68 410.845 386.378L411.261 386.1C412.02 387.234 412.766 388.376 413.5 389.528L413.079 389.796C413.445 390.37 413.807 390.947 414.167 391.525L414.592 391.261C416.032 393.577 417.422 395.928 418.759 398.312L418.323 398.556C419.322 400.335 420.291 402.133 421.231 403.948L421.675 403.718C422.302 404.93 422.917 406.15 423.518 407.378L423.068 407.598C423.368 408.209 423.663 408.822 423.956 409.437L424.407 409.223C425.578 411.685 426.695 414.177 427.758 416.698L427.297 416.892C428.088 418.771 428.849 420.665 429.578 422.574L430.045 422.396C430.532 423.67 431.005 424.951 431.464 426.239L430.993 426.407C431.221 427.047 431.445 427.689 431.666 428.333L432.139 428.17C433.024 430.746 433.853 433.348 434.625 435.975L434.145 436.115C434.72 438.073 435.263 440.044 435.773 442.028L436.258 441.903C436.597 443.221 436.921 444.544 437.231 445.874L436.744 445.987C436.899 446.65 437.05 447.314 437.197 447.98L437.686 447.871C438.274 450.528 438.804 453.206 439.275 455.905L438.782 455.991C439.133 457.998 439.45 460.016 439.734 462.044L440.229 461.975C440.418 463.324 440.592 464.678 440.751 466.036L440.255 466.094C440.334 466.772 440.41 467.45 440.481 468.13L440.979 468.077C441.265 470.779 441.491 473.499 441.658 476.236L441.159 476.266C441.283 478.296 441.373 480.334 441.429 482.382L441.929 482.368Z" stroke="white" strokeDasharray="2 4 6 8" />
      <path d="M103.967 608.073L105.777 610.402L94.2486 619.36L88.4871 611.946L90.4138 610.448L94.3653 615.534L97.6975 612.944L94.5069 608.838L96.3626 607.396L99.5532 611.502L103.967 608.073Z" fill="white" />
      <path d="M68.675 538.965C69.4467 541.688 68.6073 543.714 66.0767 544.576L65.0888 542.081C66.2095 541.525 66.7974 540.849 66.4484 539.617C66.0475 538.203 64.8194 537.574 61.1567 538.55C61.9783 539.138 62.7936 540.071 63.2136 541.553C63.8817 543.91 63.1072 545.761 60.2017 546.585C56.9402 547.509 55.0108 545.946 54.1681 542.973C53.3118 539.952 54.1744 537.348 59.9759 535.704C65.431 534.158 67.7832 535.819 68.675 538.965ZM59.4301 543.789C60.7385 543.418 61.4272 542.547 61.0536 541.229C60.7918 540.306 60.1532 539.593 59.4455 539.076C56.6825 540.036 56.0747 541.009 56.4401 542.298C56.8165 543.626 57.91 544.22 59.4301 543.789Z" fill="white" />
      <path d="M56.1041 517.466C61.1256 516.519 63.8828 517.973 64.5183 521.344C65.1556 524.724 63.1173 527.083 58.0958 528.03C52.8482 529.019 50.3072 527.524 49.6699 524.143C49.0344 520.773 50.8565 518.455 56.1041 517.466ZM57.5325 525.042C61.2274 524.346 62.3176 523.489 62.0026 521.818C61.6876 520.148 60.3622 519.757 56.6673 520.453C52.9626 521.152 51.8706 521.999 52.1856 523.669C52.5005 525.34 53.8278 525.741 57.5325 525.042ZM57.3846 523.88C58.3378 523.7 58.8336 523.199 58.6928 522.452C58.5501 521.696 57.9061 521.41 56.9529 521.59C55.98 521.773 55.5038 522.27 55.6465 523.027C55.7873 523.774 56.4117 524.063 57.3846 523.88Z" fill="white" />
      <path d="M61.1781 485.873C61.1863 487.113 60.3631 488.138 59.0131 488.147C57.6432 488.156 56.8364 487.142 56.8282 485.902C56.8201 484.682 57.6134 483.666 58.9833 483.657C60.3333 483.648 61.17 484.653 61.1781 485.873Z" fill="white" />
      <path d="M64.0816 450.327C63.8681 451.548 62.8748 452.41 61.545 452.177C60.1955 451.942 59.5831 450.799 59.7966 449.578C60.0067 448.376 60.9687 447.519 62.3182 447.755C63.6481 447.987 64.2917 449.125 64.0816 450.327Z" fill="white" />
      <path d="M73.2921 415.872C72.8637 417.036 71.7324 417.706 70.4655 417.24C69.1799 416.766 68.7816 415.533 69.21 414.369C69.6315 413.224 70.7312 412.553 72.0168 413.026C73.2837 413.493 73.7136 414.727 73.2921 415.872Z" fill="white" />
      <path d="M88.5128 383.619C87.8833 384.687 86.6504 385.144 85.4873 384.459C84.307 383.763 84.1356 382.478 84.7651 381.41C85.3844 380.359 86.5864 379.895 87.7668 380.591C88.9298 381.276 89.1322 382.567 88.5128 383.619Z" fill="white" />
      <path d="M97.7517 344.622C99.6664 342.404 101.919 341.892 103.69 343.421C105.022 344.571 105.063 345.993 104.757 347.235C106.309 346.646 107.972 346.418 109.585 347.81C111.734 349.666 111.113 352.207 109.028 354.622C107.048 356.915 104.729 357.688 102.769 355.995C101.217 354.656 101.2 352.976 101.574 351.503C100.177 351.882 98.7401 351.817 97.4533 350.706C95.4853 349.007 96.033 346.613 97.7517 344.622ZM104.247 353.533C105.337 354.474 106.493 353.9 107.336 352.924C108.258 351.856 108.407 350.796 107.567 350.071C106.666 349.293 105.56 349.778 103.352 350.805C103.25 351.734 103.384 352.788 104.247 353.533ZM99.3633 348.616C100.234 349.368 101.309 348.856 102.733 348.156C102.968 347.302 103.11 346.342 102.27 345.617C101.415 344.878 100.351 345.162 99.5012 346.146C98.7301 347.039 98.6139 347.969 99.3633 348.616Z" fill="white" />
      <path d="M120.034 332.308C123.587 335.981 123.889 339.083 121.423 341.468C118.951 343.859 115.86 343.454 112.307 339.781C108.595 335.943 108.446 332.999 110.918 330.607C113.384 328.222 116.321 328.469 120.034 332.308ZM114.492 337.668C117.106 340.37 118.421 340.81 119.643 339.628C120.865 338.446 120.463 337.124 117.849 334.421C115.228 331.711 113.92 331.265 112.698 332.447C111.476 333.629 111.871 334.958 114.492 337.668ZM115.382 336.905C116.056 337.602 116.747 337.741 117.293 337.212C117.847 336.677 117.731 335.982 117.057 335.285C116.368 334.573 115.691 334.449 115.138 334.984C114.592 335.512 114.694 336.193 115.382 336.905Z" fill="white" />
      <path d="M149.21 319.168C148.179 319.857 146.87 319.734 146.12 318.611C145.358 317.472 145.762 316.24 146.793 315.551C147.808 314.874 149.092 314.978 149.853 316.117C150.603 317.239 150.224 318.49 149.21 319.168Z" fill="white" />
      <path d="M180.493 302.042C179.356 302.536 178.09 302.18 177.552 300.942C177.007 299.685 177.624 298.545 178.762 298.051C179.881 297.566 181.126 297.898 181.671 299.155C182.209 300.393 181.612 301.556 180.493 302.042Z" fill="white" />
      <path d="M214.334 290.783C213.126 291.066 211.944 290.489 211.637 289.175C211.325 287.841 212.136 286.83 213.344 286.547C214.532 286.27 215.697 286.819 216.009 288.153C216.316 289.468 215.522 290.506 214.334 290.783Z" fill="white" />
      <path d="M249.642 285.755C248.404 285.817 247.344 285.039 247.276 283.69C247.208 282.322 248.187 281.472 249.425 281.41C250.644 281.349 251.692 282.098 251.761 283.466C251.828 284.815 250.861 285.694 249.642 285.755Z" fill="white" />
      <path d="M282.443 271.621L292.111 272.883L291.888 274.588L285.719 286.772L282.784 286.389L288.602 274.885L282.127 274.04L282.443 271.621Z" fill="white" />
      <path d="M309.832 283.858C308.718 288.845 306.293 290.803 302.946 290.056C299.588 289.306 298.227 286.502 299.34 281.515C300.504 276.303 302.881 274.56 306.238 275.309C309.586 276.057 310.995 278.646 309.832 283.858ZM302.307 282.178C301.488 285.847 301.844 287.187 303.504 287.558C305.163 287.928 306.046 286.865 306.865 283.195C307.686 279.516 307.34 278.178 305.68 277.808C304.021 277.437 303.129 278.498 302.307 282.178ZM303.434 282.501C303.222 283.448 303.486 284.101 304.228 284.266C304.98 284.434 305.496 283.955 305.708 283.009C305.923 282.042 305.655 281.409 304.904 281.241C304.162 281.075 303.649 281.535 303.434 282.501Z" fill="white" />
      <path d="M336.852 300.997C335.71 300.515 335.093 299.353 335.618 298.11C336.151 296.847 337.402 296.507 338.544 296.989C339.668 297.464 340.287 298.593 339.755 299.855C339.23 301.099 337.976 301.471 336.852 300.997Z" fill="white" />
      <path d="M368.362 317.703C367.324 317.025 366.925 315.772 367.663 314.642C368.413 313.495 369.705 313.384 370.743 314.063C371.764 314.73 372.171 315.952 371.421 317.099C370.683 318.229 369.383 318.371 368.362 317.703Z" fill="white" />
      <path d="M396.378 339.773C395.478 338.92 395.309 337.616 396.238 336.636C397.18 335.642 398.471 335.763 399.371 336.616C400.256 337.456 400.439 338.731 399.496 339.725C398.567 340.705 397.263 340.612 396.378 339.773Z" fill="white" />
      <path d="M419.998 366.495C419.265 365.494 419.332 364.181 420.421 363.383C421.526 362.574 422.774 362.924 423.507 363.924C424.228 364.908 424.179 366.196 423.074 367.005C421.985 367.803 420.719 367.479 419.998 366.495Z" fill="white" />
      <path d="M452.276 390.591C453.513 393.136 453.042 395.278 450.702 396.571L449.292 394.288C450.297 393.543 450.758 392.775 450.202 391.633C449.555 390.302 448.245 389.894 444.801 391.501C445.722 391.932 446.684 392.698 447.362 394.092C448.433 396.296 447.987 398.259 445.271 399.579C442.222 401.062 440.048 399.861 438.697 397.082C437.324 394.258 437.725 391.539 443.139 388.907C448.238 386.427 450.846 387.65 452.276 390.591ZM443.209 392.32C440.666 393.745 440.234 394.823 440.82 396.028C441.419 397.26 442.609 397.649 444.021 396.962C445.244 396.368 445.769 395.39 445.17 394.157C444.754 393.303 444 392.713 443.209 392.32Z" fill="white" />
      <path d="M454.688 415.719C449.91 417.532 446.941 416.584 445.724 413.377C444.503 410.161 446.096 407.481 450.873 405.668C455.866 403.773 458.63 404.799 459.85 408.016C461.068 411.222 459.68 413.824 454.688 415.719ZM451.952 408.51C448.437 409.845 447.514 410.879 448.117 412.469C448.72 414.058 450.094 414.211 453.609 412.877C457.134 411.539 458.06 410.513 457.457 408.924C456.854 407.335 455.477 407.173 451.952 408.51ZM452.302 409.629C451.395 409.973 450.995 410.553 451.264 411.264C451.537 411.984 452.222 412.152 453.129 411.807C454.054 411.456 454.436 410.884 454.163 410.164C453.893 409.453 453.227 409.278 452.302 409.629Z" fill="white" />
      <path d="M455.236 447.712C455.01 446.493 455.641 445.339 456.968 445.093C458.315 444.844 459.288 445.701 459.513 446.92C459.735 448.12 459.132 449.259 457.785 449.508C456.458 449.754 455.458 448.912 455.236 447.712Z" fill="white" />
      <path d="M458.614 483.216C458.61 481.976 459.437 480.953 460.787 480.949C462.157 480.944 462.96 481.962 462.964 483.202C462.968 484.422 462.172 485.434 460.802 485.439C459.452 485.443 458.618 484.436 458.614 483.216Z" fill="white" />
      <path d="M455.592 518.752C455.81 517.532 456.806 516.673 458.135 516.91C459.484 517.15 460.092 518.295 459.875 519.516C459.661 520.717 458.696 521.571 457.347 521.33C456.018 521.093 455.378 519.953 455.592 518.752Z" fill="white" />
      <path d="M446.267 553.176C446.699 552.014 447.833 551.347 449.098 551.818C450.382 552.295 450.776 553.53 450.344 554.693C449.919 555.836 448.817 556.504 447.533 556.026C446.267 555.555 445.842 554.319 446.267 553.176Z" fill="white" />
      <path d="M445.899 589.563L441.59 596.82L439.492 595.574L442.632 590.286L439.796 588.09C439.856 588.929 439.66 589.906 439.027 590.972C437.592 593.388 435.326 593.915 432.72 592.368C429.771 590.616 429.603 587.981 431.231 585.238C432.732 582.71 434.895 581.575 437.528 583.115L436.359 585.631C435.055 585.008 433.918 585.356 433.198 586.569C432.463 587.807 432.705 588.986 434.27 589.915C435.817 590.834 437.058 590.547 437.778 589.335C438.344 588.38 438.242 587.436 438.009 586.751L439.616 584.75L445.899 589.563Z" fill="white" />
      <path d="M424.238 609.222C420.096 606.229 419.254 603.228 421.263 600.447C423.278 597.659 426.392 597.515 430.534 600.508C434.862 603.636 435.525 606.508 433.511 609.296C431.502 612.077 428.566 612.349 424.238 609.222ZM428.753 602.972C425.706 600.77 424.334 600.569 423.338 601.947C422.343 603.325 422.971 604.556 426.018 606.758C429.074 608.965 430.44 609.175 431.436 607.797C432.431 606.419 431.809 605.18 428.753 602.972ZM428.011 603.88C427.225 603.312 426.521 603.296 426.076 603.912C425.625 604.536 425.861 605.2 426.647 605.768C427.449 606.348 428.137 606.352 428.588 605.728C429.033 605.112 428.814 604.459 428.011 603.88Z" fill="white" />
    </>
  );
};
