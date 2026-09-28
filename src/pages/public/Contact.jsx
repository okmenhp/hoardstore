import { Link } from "react-router-dom";

function Contact() {
  return (
    <main className="contact-page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <div className="container breadcrumb__inner">
          <Link to="/" className="breadcrumb__home">
            Trang chủ
          </Link>

          <div className="breadcrumb__item">
            <span className="breadcrumb__separator">/</span>
            <span>Liên hệ</span>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Title */}
        <section className="contact-title">
          <h1>Liên hệ với chúng tôi</h1>
          <p>
            Bạn cần tư vấn sản phẩm hoặc muốn biết thêm thông tin? Hãy liên hệ
            với HoardStore, chúng tôi luôn sẵn sàng hỗ trợ.
          </p>
        </section>

        {/* Contact content */}
        <section className="contact-content">
          {/* Information */}
          <div className="contact-info">
            <div className="contact-card">
              <div className="contact-card-icon">
                <i className="fa-solid fa-phone"></i>
              </div>

              <div>
                <h3>Hotline</h3>
                <p>Liên hệ trực tiếp với chúng tôi</p>

                <a href="tel:0862074660">086.207.4660</a>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card-icon">
                ``
                <i className="fa-solid fa-comment"></i>
              </div>

              <div>
                <h3>Zalo</h3>
                <p>Nhắn tin để được tư vấn sản phẩm</p>

                <a
                  href="https://zalo.me/0862074660"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Nhắn tin qua Zalo
                </a>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card-icon">
                <i className="fa-solid fa-envelope"></i>
              </div>

              <div>
                <h3>Email</h3>
                <p>Gửi câu hỏi hoặc yêu cầu cho chúng tôi</p>

                <a href="mailto:hoardstore@gmail.com">hoardstore@gmail.com</a>
              </div>
            </div>

            <div className="contact-card">
              <div className="contact-card-icon">
                <i className="fa-solid fa-clock"></i>
              </div>

              <div>
                <h3>Thời gian hỗ trợ</h3>
                <p>Thời gian tư vấn và hỗ trợ</p>

                <strong>08:00 - 22:00</strong>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="contact-box">
            <div className="contact-box-icon">
              <i className="fa-solid fa-headset"></i>
            </div>

            <h2>Bạn đang quan tâm sản phẩm?</h2>

            <p>
              Nếu bạn cần thêm hình ảnh, thông tin sản phẩm, tình trạng hàng
              hoặc cần tư vấn trước khi mua, hãy liên hệ trực tiếp với
              HoardStore.
            </p>

            <div className="contact-actions">
              <a
                href="tel:0862074660"
                className="contact-action contact-action--phone"
              >
                <i className="fa-solid fa-phone"></i>
                Gọi ngay
              </a>

              <a
                href="https://zalo.me/0862074660"
                target="_blank"
                rel="noopener noreferrer"
                className="contact-action contact-action--zalo"
              >
                <i className="fa-solid fa-comment"></i>
                Nhắn Zalo
              </a>
            </div>
          </div>
        </section>

        {/* Support */}
        <section className="contact-support">
          <div className="section-heading">
            <span>HỖ TRỢ</span>
            <h2>HoardStore có thể hỗ trợ bạn</h2>
          </div>

          <div className="contact-support-grid">
            <div className="contact-support-item">
              <i className="fa-solid fa-box"></i>

              <h3>Thông tin sản phẩm</h3>

              <p>
                Tư vấn về sản phẩm, kích thước, hình ảnh và các thông tin liên
                quan.
              </p>
            </div>

            <div className="contact-support-item">
              <i className="fa-solid fa-truck"></i>

              <h3>Đặt hàng & giao hàng</h3>

              <p>Hỗ trợ tư vấn đặt hàng và thông tin giao hàng của sản phẩm.</p>
            </div>

            <div className="contact-support-item">
              <i className="fa-solid fa-shield-halved"></i>

              <h3>Bảo hành & hỗ trợ</h3>

              <p>Hỗ trợ các vấn đề liên quan đến sản phẩm sau khi mua hàng.</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Contact;
