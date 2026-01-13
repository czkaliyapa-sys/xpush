import { quotes } from "../assets";

const FeedbackCard = ({ content, name, title }) => (
  <div className="flex flex-col px-10 py-12 rounded-[20px] w-full max-w-full my-0 feedback-card">
    <img src={quotes} alt="double_quotes" className="w-[42.6px] h-[27.6px] object-contain" />
    <p className="font-poppins font-normal text-[18px] leading-[32.4px] text-white my-10">
      {content}
    </p>

    <div className="flex flex-row">
      <div className="flex flex-col ml-4">
        <h4 className="font-poppins font-semibold text-[20px] leading-[32px] text-white">
          {name}
        </h4>
        <p className="font-poppins font-normal text-[16px] leading-[24px] text-white">
          {title}
        </p>
      </div>
    </div>
  </div>
);


export default FeedbackCard;