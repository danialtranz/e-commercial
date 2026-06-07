const serverOrigin =
  process.env.NEXT_PUBLIC_API_SERVER?.replace(/\/$/, "") ||
  "http://localhost:8889";

/** Trình duyệt: gọi qua proxy Next (cùng origin). SSR: gọi thẳng BE. */
const api_host =
  typeof window !== "undefined" ? "/api/be/v1" : `${serverOrigin}/v1`;

export { api_host, serverOrigin };

const api = {
  oauthLogin: `${api_host}/user/oAuth-login`,

  // ==========================
  // User — đăng ký / đăng nhập mật khẩu
  // ==========================
  /** POST — body: fullName, userName, email, phoneNumber, password */
  userSignUp: `${api_host}/user/sign-up`,
  /** POST — body: email, password */
  userSignInPw: `${api_host}/user/sign-in-pw`,
  /** POST — body: email — gửi mã OTP khôi phục mật khẩu */
  userTakeResetCode: `${api_host}/user/tke-code`,
  /** POST — body: email, new_password, code */
  userForgotPassword: `${api_host}/user/fg-pasw`,
  /** POST — JWT — body: old_password, new_password */
  userChangePassword: `${api_host}/user/chag-pasw`,

  // ==========================
  // Shop TMDT — catalog công khai
  // ==========================
  catalogProducts: `${api_host}/catalog/products`,
  catalogProduct: (id: string) => `${api_host}/catalog/products/${id}`,
  catalogCategories: `${api_host}/catalog/categories`,

  /** GET — thông tin shop mặc định (public, không JWT) */
  publicShopInfo: `${api_host}/public/shopInfo`,
  /** GET — quảng cáo đang active (public, không JWT) */
  publicActiveAdvertisement: `${api_host}/public/active-advertisement`,
  /** GET — danh mục active, mỗi tên trùng một row đại diện (public, không JWT) */
  publicCategories: `${api_host}/public/categories`,
  /** POST — body `{ keyWord }`; header `page`, `page_size` — tìm sản phẩm theo tên */
  publicProductSearch: `${api_host}/public/product-search`,
  /** POST — query `shopId`, `page`, `page_size`; body `{ sortStrategy }` — sắp xếp SP (public) */
  publicProductSort: `${api_host}/public/product-sort`,

  // ==========================
  // Shop TMDT — admin (JWT + role admin)
  // ==========================
  adminProducts: `${api_host}/admin/products`,
  adminProductById: (id: string) => `${api_host}/admin/products/${id}`,
  adminCategorie: `${api_host}/admin/categorie`,

  // ==========================
  // User — đơn hàng (JWT)
  // ==========================
  userOrder: `${api_host}/user/order`,
  userCartOrder: `${api_host}/user/cart-order`,
  /** POST — body `{ action: "increase" | "decrease", productId }` — cập nhật quantity trong giỏ */
  userUpdateQuantityProd: `${api_host}/user/update-quantity-prod`,
  userCreateOrder: `${api_host}/user/create-order`,
  userCheckout: `${api_host}/user/checkout`,
  userOrders: `${api_host}/user/orders`,
  userOrderById: (id: string) => `${api_host}/user/orders/${id}`,
  /** GET — query `page`, `page_size` — đơn + thanh toán + giao hàng */
  userDeliveryStatus: `${api_host}/user/delivery-status`,
  /** POST — body `{ orderId, reason }` — user hủy đơn (status processing) */
  userCancelOrder: `${api_host}/user/cancel-order`,
  /** POST — query `page`, `page_size` — danh sách user_voucher active của user */
  userVouchers: `${api_host}/user/vouchers`,
  /** POST — body `{ voucherId }` hoặc `{ voucher_id }` — đổi điểm lấy user_voucher */
  userClaimVoucher: `${api_host}/user/claim-voucher`,
  /** GET — lấy credit hiện tại của user từ JWT */
  userMyCredit: `${api_host}/user/my-credit`,

  // ==========================
  // User — shops (JWT)
  // ==========================
  userShops: `${api_host}/user/shops`,
  userProducts: `${api_host}/user/products`,
  userConversationAsk: `${api_host}/user/conversation/ask`,
  userConversationHistory: `${api_host}/user/conversation/history`,

  // ==========================
  // Shop owner (JWT + x-shop-id)
  // ==========================
  shopownerProducts: `${api_host}/shopowner/products`,
  shopownerProductImage: `${api_host}/shopowner/product-image`,
  /** POST điều chỉnh tồn | GET lịch sử & tồn còn — query `id`, `page`, `page_size` */
  shopownerManagerQuantity: `${api_host}/shopowner/manager-quantity`,

  /** POST multipart — field `file` */
  shopownerAdv: `${api_host}/shopowner/adv`,
  /** GET — query `page`, `page_size` */
  shopownerAdvs: `${api_host}/shopowner/advs`,
  /** POST — query `adv_id`, body `{ status }` */
  shopownerAdvStaCamp: `${api_host}/shopowner/adv/sta-camp`,

  /** POST — body: product_target_id, campaign_start_at, expired_in, total_quantity, discount */
  shopownerFlscamp: `${api_host}/shopowner/Flscamp`,
  /** GET — query `page`, `page_size` */
  shopownerFlscamps: `${api_host}/shopowner/Flscamps`,
  /** POST — query `flash_sale_campaign_id`, body `{ status }` */
  shopownerFlscampUpdtStatus: `${api_host}/shopowner/Flscamp/updt-status`,

  /** POST multipart — product_id, comment?, file?, star? (1–5) */
  shopownerComment: `${api_host}/shopowner/comment`,
  /** GET — query `product_id`, `page`, `page_size` */
  shopownerComments: `${api_host}/shopowner/comments`,

  /** POST — body: `name`, `discount` */
  shopownerVoucher: `${api_host}/shopowner/voucher`,
  /** GET — query `page`, `page_size` */
  shopownerVouchers: `${api_host}/shopowner/vouchers`,

  /**
   * POST — query `days_ago` hoặc body `{ from, to }` (DD-MM-YYYY); header `x-shop-id`
   */
  shopownerIncome: `${api_host}/shopowner/income`,

  /** POST — body: `email`, `status` (`active` | `inactive`) */
  shopownerBannedUser: `${api_host}/shopowner/banned-user`,
  /** GET — query `page`, `page_size` — danh sách user + thống kê đơn theo status */
  shopownerUsers: `${api_host}/shopowner/users`,

  // ==========================
  // Collaborator / shipper (JWT + role collaborator)
  // ==========================
  /** GET `page`, `page_size` | PATCH query `shipper_assignment_id`, body `deliver_status` */
  collaboratorMyDelivery: `${api_host}/collaborator/my-delivery`,
  /** POST | PATCH — body `shipper_zone` (I1…I5) */
  collaboratorUptInfo: `${api_host}/collaborator/upt-info`,
  /** GET | POST — thông tin user + `shipper_infor` (JWT collaborator) */
  collaboratorCollaInfo: `${api_host}/collaborator/colla-info`,

  // ==========================
  // Translation
  // ==========================
  translationUnderstandText: `${api_host}/translation/understand-text`,

  // ==========================
  // Admin - Course Management
  // ==========================
  adminCreateCourse: `${api_host}/admin/course`,
  adminGetCourses: `${api_host}/admin/courses`,
  adminCourseUpload: `${api_host}/admin/course/upload`,
  adminCourseImage: `${api_host}/admin/course/image`,
  adminCourseAction: `${api_host}/admin/course/action`,

  // ==========================
  // Admin - Question Management
  // ==========================
  // Tạo / Lấy danh sách / Cập nhật / Xóa question: /admin/question[?type=...&id=...&page_size=...&page=... | ?id=...]
  adminQuestion: `${api_host}/admin/question`,

  // ==========================
  // Admin - Quiz Management
  // ==========================
  // Tạo quiz: POST /admin/q
  adminCreateQuiz: `${api_host}/admin/q`,
  // Lấy danh sách / Lấy chi tiết / Cập nhật / Xóa quiz:
  //   GET    /admin/quizze?type=...&id=...
  //   GET    /admin/quizze?id=...
  //   PUT    /admin/quizze?id=...
  //   DELETE /admin/quizze?id=...
  adminQuiz: `${api_host}/admin/quizze`,

  // ==========================
  // Admin - Chapter Management
  // ==========================
  // Tạo / Lấy / Cập nhật / Xóa 1 chapter: /admin/chapter[?id=...]
  adminCreateChapter: `${api_host}/admin/chapter`,
  // Lấy danh sách chapter theo course_id: /admin/chapters?course_id=...
  adminGetChapters: `${api_host}/admin/chapters`,

  // ==========================
  // Admin - Lesson Management
  // ==========================
  // Tạo / Lấy / Cập nhật / Xóa 1 lesson: /admin/lesson[?id=...]
  adminCreateLesson: `${api_host}/admin/lesson`,
  // Lấy danh sách lesson theo chapter_id: /admin/lessons?chapter_id=...
  adminGetLessons: `${api_host}/admin/lessons`,

  // ==========================
  // Admin - Lesson Content Management
  // ==========================
  // Upload file (PDF/MP4) cho lesson: /admin/upload
  adminUploadLessonContent: `${api_host}/admin/upload`,
  // Xóa lesson content: /admin/delete?lesson_contents=...
  adminDeleteLessonContent: `${api_host}/admin/delete`,
  // Lấy lesson content (file): /admin?lesson_contents=...
  adminGetLessonContent: `${api_host}/admin`,

  // ==========================
  // User - Quiz Management
  // ==========================
  // Tạo quiz: POST /user/quizz
  userQuiz: `${api_host}/user/quizz`,
  // Bắt đầu bài thi: POST /user/quizz/start
  userQuizStart: `${api_host}/user/quizz/start`,
  // Cập nhật kết quả từng câu: POST /user/quizz/answer
  userQuizAnswer: `${api_host}/user/quizz/answer`,
  // Nộp bài: POST /user/quizz/submit
  userQuizSubmit: `${api_host}/user/quizz/submit`,
  // Lịch sử nộp bài chi tiết: GET /user/quizz/history?attemp_id=...
  userQuizHistory: `${api_host}/user/quizz/history`,
  // Tất cả các lịch sử nộp bài: GET /user/quizz/historys
  userQuizHistorys: `${api_host}/user/quizz/historys`,

  // ==========================
  // Admin - User Management
  // ==========================
  // Lấy danh sách users: GET /admin/users?page=...&page_size=...
  adminGetUsers: `${api_host}/admin/users`,
  // Lấy lịch sử user: POST /admin/user-history
  adminUserHistory: `${api_host}/admin/user-history`,
  // Lấy danh sách bài thi được làm: POST /admin/user-historys
  adminUserHistorys: `${api_host}/admin/user-historys`,
  // Lấy chi tiết bài thi: GET /admin/user-history?quiz_type=...&attempt_id=...
  adminUserHistoryDetail: `${api_host}/admin/user-history`,

  //////
};
export default api;
