import { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import { supabase } from "../lib/supabaseClient";

import "swiper/css";
import "swiper/css/pagination";

function Banner() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    const loadBanners = async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("id, image_url, sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) {
        console.error("Load banners error:", error);
        return;
      }

      setBanners(data || []);
    };

    loadBanners();
  }, []);

  return (
    <div className="banner">
      <Swiper
        modules={[Autoplay, Pagination]}
        loop={banners.length > 1}
        autoplay={
          banners.length > 1
            ? {
                delay: 3000,
                disableOnInteraction: false,
              }
            : false
        }
        pagination={{
          clickable: true,
        }}
        slidesPerView={1}
      >
        {banners.map((banner) => (
          <SwiperSlide key={banner.id}>
            <img src={banner.image_url} alt="Banner HoardStore" />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

export default Banner;
