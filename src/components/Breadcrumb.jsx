import { Link } from "react-router-dom";

function Breadcrumb({ items = [] }) {
  return (
    <div className="breadcrumb">
      <div className="container">
        <div className="breadcrumb__inner">
          <Link to="/" className="breadcrumb__home">
            Trang chủ
          </Link>

          {items.map((item, index) => (
            <div className="breadcrumb__item" key={index}>
              <span className="breadcrumb__separator">/</span>

              {item.link ? (
                <Link to={item.link}>{item.label}</Link>
              ) : (
                <span>{item.label}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Breadcrumb;
