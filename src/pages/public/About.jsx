function About() {
  return (
    <div className="about-page container">
      {/* Tiêu đề */}
      <div className="about-title">
        <h1>Giới thiệu</h1>
      </div>

      {/* Giới thiệu chung */}
      <section className="about-card about-intro">
        <div className="about-icon">🎮</div>

        <div>
          <h2>Về HoardStore</h2>
          <p>
            HoardStore chuyên cung cấp các sản phẩm mô hình lấy cảm hứng từ
            những tựa game nổi tiếng như CrossFire, Valorant và CS:GO.
          </p>

          <p>
            Hầu hết sản phẩm của Shop đều được hoàn thiện từ chất liệu kim loại,
            có độ bền cao, thiết kế đẹp mắt và phù hợp để sưu tầm, trưng bày
            hoặc làm quà tặng.
          </p>
        </div>
      </section>

      {/* Lưu ý */}
      <section className="about-card about-note">
        <div className="about-icon">ℹ️</div>

        <div>
          <h2>Lưu ý về sản phẩm</h2>

          <p>
            Các sản phẩm của Shop không sắc, nhọn nên được xem là mô hình, không
            phải là vũ khí theo quy định pháp luật hiện hành.
          </p>

          <p>
            Quý khách có thể chủ động tra cứu các quy định pháp luật liên quan
            để có thêm thông tin chi tiết.
          </p>
        </div>
      </section>

      {/* Cam kết */}
      <section className="about-section">
        <div className="section-heading">
          <h2>Shop cam kết</h2>
        </div>

        <div className="commit-grid">
          <div className="commit-item">
            <div className="commit-icon">🚚</div>
            <h3>Giao hàng nhanh</h3>
            <p>Đóng gói cẩn thận và hỗ trợ giao hàng trên toàn quốc.</p>
          </div>

          <div className="commit-item">
            <div className="commit-icon">💰</div>
            <h3>Giá cả hợp lý</h3>
            <p>Mức giá phù hợp với nhiều nhu cầu và ngân sách của game thủ.</p>
          </div>

          <div className="commit-item">
            <div className="commit-icon">🎁</div>
            <h3>Freeship từ 500K</h3>
            <p>Miễn phí vận chuyển cho đơn hàng từ 500.000đ.</p>
          </div>

          <div className="commit-item">
            <div className="commit-icon">💬</div>
            <h3>Tư vấn nhiệt tình</h3>
            <p>Hỗ trợ tư vấn sản phẩm và giải đáp thắc mắc cho khách hàng.</p>
          </div>

          <div className="commit-item">
            <div className="commit-icon">🔄</div>
            <h3>Hỗ trợ đổi trả</h3>
            <p>
              Hỗ trợ đổi trả, hoàn tiền nếu sản phẩm bị lỗi hoặc không giống
              hình ảnh mô tả.
            </p>
          </div>

          <div className="commit-item">
            <div className="commit-icon">📦</div>
            <h3>Ship COD toàn quốc</h3>
            <p>
              Khách hàng có thể lựa chọn hình thức thanh toán COD khi nhận hàng.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
