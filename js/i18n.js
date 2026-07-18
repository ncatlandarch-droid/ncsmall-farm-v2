/* ==========================================================================
   NC Small Farm Platform V.2 — i18n (Internationalization)
   8-language translation system
   ========================================================================== */

window.LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'es', label: 'Español', flag: '🇲🇽' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'ko', label: '한국어', flag: '🇰🇷' },
  { code: 'ht', label: 'Kreyòl Ayisyen', flag: '🇭🇹' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' }
];

window.TRANSLATIONS = {
  nav_navigator:    { en:'Interactive Navigator', es:'Navegador Interactivo', fr:'Navigateur Interactif', zh:'互动导航器', vi:'Điều hướng tương tác', ko:'대화형 내비게이터', ht:'Navigatè Entèaktif', ar:'مرشد تفاعلي' },
  nav_directory:    { en:'Resource Directory', es:'Directorio de Recursos', fr:'Répertoire des Ressources', zh:'资源目录', vi:'Danh mục tài nguyên', ko:'리소스 디렉토리', ht:'Repètwè Resous', ar:'دليل الموارد' },
  nav_geoscope:     { en:'Geoscope Farm Planner', es:'Planificador Agrícola Geoscope', fr:'Planificateur Agricole Geoscope', zh:'Geoscope农场规划师', vi:'Kế hoạch nông trại Geoscope', ko:'Geoscope 농장 플래너', ht:'Planifikatè Fèm Geoscope', ar:'مخطط مزرعة جيوسكوب' },
  nav_ppgis:        { en:'Field Survey', es:'Encuesta de Campo', fr:'Relevé de Terrain', zh:'现场调查', vi:'Khảo sát thực địa', ko:'현장 조사', ht:'Sondaj Teren', ar:'مسح ميداني' },
  voice_on:         { en:'🔊 VOICE ON', es:'🔊 VOZ ACTIVA', fr:'🔊 VOIX ON', zh:'🔊 语音开启', vi:'🔊 GIỌNG NÓI BẬT', ko:'🔊 음성 켜기', ht:'🔊 VWA AKTIVE', ar:'🔊 الصوت مفعّل' },
  voice_off:        { en:'🔇 VOICE OFF', es:'🔇 VOZ INACTIVA', fr:'🔇 VOIX OFF', zh:'🔇 语音关闭', vi:'🔇 GIỌNG NÓI TẮT', ko:'🔇 음성 끄기', ht:'🔇 VWA DEZAKTIVE', ar:'🔇 الصوت معطّل' },
  hero_title:       { en:'How can I help?', es:'¿Cómo puedo ayudar?', fr:'Comment puis-je aider?', zh:'我能怎样帮助您?', vi:'Tôi có thể giúp gì?', ko:'어떻게 도와드릴까요?', ht:'Kijan mwen ka ede w?', ar:'كيف يمكنني مساعدتك؟' },
  hero_desc:        { en:'I am Aggie, your AI assistant powered by ncsmall.farm. Welcome to NCsmall.farm, your guide to NRCS conservation programs. Choose a pathway:', es:'Soy Aggie, tu asistente IA de ncsmall.farm. Bienvenido a NCsmall.farm. Elija una vía:', fr:'Je suis Aggie, votre assistant IA de ncsmall.farm. Bienvenue sur NCsmall.farm. Choisissez un parcours:', zh:'我是Aggie，ncsmall.farm的AI助手。欢迎来到NCsmall.farm。请选择路径：', vi:'Tôi là Aggie, trợ lý AI từ ncsmall.farm. Chào mừng đến NCsmall.farm. Chọn lộ trình:', ko:'저는 Aggie, ncsmall.farm의 AI 어시스턴트입니다. NCsmall.farm에 오신 것을 환영합니다. 경로를 선택하세요:', ht:'Mwen se Aggie, asistan IA ncsmall.farm. Byenveni nan NCsmall.farm. Chwazi yon chemen:', ar:'أنا آغي، مساعدك الذكي من ncsmall.farm. مرحباً بك في NCsmall.farm. اختر مساراً:' },
  call_geoscope:    { en:'Call Geoscope', es:'Llamar Geoscope', fr:'Appeler Geoscope', zh:'调用Geoscope', vi:'Gọi Geoscope', ko:'Geoscope 실행', ht:'Rele Geoscope', ar:'تشغيل Geoscope' },
  geo_subtitle:     { en:'AI Farm Conservation Planner', es:'Planificador de Conservación con IA', fr:'Planificateur de Conservation IA', zh:'AI农场保护规划师', vi:'Kế hoạch bảo tồn AI', ko:'AI 보전 플래너', ht:'Planifikatè Konsèvasyon IA', ar:'مخطط الحفظ بالذكاء الاصطناعي' },
  start_intake:     { en:'Start Intake', es:'Iniciar Evaluación', fr:'Démarrer l\'Évaluation', zh:'开始评估', vi:'Bắt đầu đánh giá', ko:'평가 시작', ht:'Kòmanse Evalyasyon', ar:'بدء التقييم' },
  intake_sub:       { en:'Eligibility Assessment Form', es:'Formulario de Evaluación', fr:'Formulaire d\'Évaluation', zh:'资格评估表', vi:'Mẫu đánh giá', ko:'자격 평가 양식', ht:'Fòmilè Evalyasyon', ar:'نموذج تقييم الأهلية' },
  ai_analysis:      { en:'✨ AI Project Analysis →', es:'✨ Análisis de Proyecto IA →', fr:'✨ Analyse de Projet IA →', zh:'✨ AI项目分析 →', vi:'✨ Phân tích dự án AI →', ko:'✨ AI 프로젝트 분석 →', ht:'✨ Analiz Pwojè IA →', ar:'✨ تحليل مشروع بالذكاء →' },
  triaging:         { en:'Triaging...', es:'Clasificando...', fr:'Triage en cours...', zh:'分类中...', vi:'Đang phân loại...', ko:'분류 중...', ht:'Ap triye...', ar:'جارٍ التصنيف...' },
  describe_project: { en:'✨ Describe your project...', es:'✨ Describa su proyecto...', fr:'✨ Décrivez votre projet...', zh:'✨ 描述您的项目...', vi:'✨ Mô tả dự án của bạn...', ko:'✨ 프로젝트를 설명하세요...', ht:'✨ Dekri pwojè ou...', ar:'✨ صف مشروعك...' },
  send:             { en:'Send', es:'Enviar', fr:'Envoyer', zh:'发送', vi:'Gửi', ko:'보내기', ht:'Voye', ar:'إرسال' },
  complete_stage:   { en:'Complete Stage & Advance →', es:'Completar Etapa y Avanzar →', fr:'Terminer l\'Étape et Avancer →', zh:'完成并前进 →', vi:'Hoàn thành và tiếp tục →', ko:'단계 완료 및 진행 →', ht:'Fini Etap epi Avanse →', ar:'أكمل المرحلة وتقدم →' },
  back_nav:         { en:'↩ Navigator', es:'↩ Navegador', fr:'↩ Navigateur', zh:'↩ 导航器', vi:'↩ Điều hướng', ko:'↩ 내비게이터', ht:'↩ Navigatè', ar:'↩ المرشد' },
  ask_question:     { en:'Ask {name} a question...', es:'Haga una pregunta a {name}...', fr:'Posez une question à {name}...', zh:'向{name}提问...', vi:'Hỏi {name} một câu hỏi...', ko:'{name}에게 질문하세요...', ht:'Mande {name} yon kesyon...', ar:'اسأل {name} سؤالاً...' },
  geo_tool_label:   { en:'Spatial Assessment Tool', es:'Herramienta de Evaluación Espacial', fr:'Outil d\'Évaluation Spatiale', zh:'空间评估工具', vi:'Công cụ đánh giá không gian', ko:'공간 평가 도구', ht:'Zouti Evalyasyon Espasyal', ar:'أداة التقييم المكاني' },
  geo_title:        { en:'Geoscope Farm Planner', es:'Planificador Agrícola', fr:'Planificateur Agricole', zh:'农场规划师', vi:'Kế hoạch nông trại', ko:'농장 플래너', ht:'Planifikatè Fèm', ar:'مخطط المزرعة' },
  geo_desc:         { en:'Enter a property address to initiate a comprehensive AI-powered conservation assessment and generate a draft Farm Conservation Plan.', es:'Ingrese una dirección para iniciar una evaluación de conservación con IA.', fr:'Entrez une adresse pour lancer une évaluation de conservation par IA.', zh:'输入地址以启动AI保护评估。', vi:'Nhập địa chỉ để bắt đầu đánh giá bảo tồn bằng AI.', ko:'주소를 입력하여 AI 기반 보전 평가를 시작하세요.', ht:'Antre yon adrès pou kòmanse evalyasyon konsèvasyon IA.', ar:'أدخل عنوان العقار لبدء تقييم الحفظ بالذكاء الاصطناعي.' },
  geo_placeholder:  { en:'Enter Address (e.g. 1600 Amphitheatre Pkwy)...', es:'Ingrese Dirección...', fr:'Entrez l\'Adresse...', zh:'输入地址...', vi:'Nhập địa chỉ...', ko:'주소 입력...', ht:'Antre Adrès...', ar:'أدخل العنوان...' },
  geo_button:       { en:'Begin Farm Conservation Analysis →', es:'Iniciar Análisis de Conservación →', fr:'Commencer l\'Analyse de Conservation →', zh:'开始农场保护分析 →', vi:'Bắt đầu phân tích bảo tồn nông trại →', ko:'농장 보전 분석 시작 →', ht:'Kòmanse Analiz Konsèvasyon →', ar:'بدء تحليل حفظ المزرعة →' },
  geo_scanning:     { en:'Surveying Property', es:'Analizando Propiedad', fr:'Analyse de la Propriété', zh:'地产勘测中', vi:'Đang khảo sát', ko:'조사 중', ht:'Ap sonde pwopriyete a', ar:'مسح العقار' },
  geo_scanning_sub: { en:'Analyzing aerial imagery, soil data, and conservation opportunities...', es:'Analizando imágenes, suelo y oportunidades de conservación...', fr:'Analyse des images, du sol et des opportunités de conservation...', zh:'分析航拍、土壤和保护机会...', vi:'Phân tích hình ảnh, đất và cơ hội bảo tồn...', ko:'이미지, 토양 데이터 및 보전 기회 분석 중...', ht:'Ap analize imaj, done tè ak opòtinite konsèvasyon...', ar:'تحليل الصور والتربة وفرص الحفظ...' },
  geo_complete:     { en:'Farm Conservation Plan Ready', es:'Plan de Conservación Listo', fr:'Plan de Conservation Prêt', zh:'保护计划就绪', vi:'Kế hoạch bảo tồn sẵn sàng', ko:'보전 계획 준비 완료', ht:'Plan Konsèvasyon Prè', ar:'خطة الحفظ جاهزة' },
  new_scan:         { en:'New Scan', es:'Nuevo Escaneo', fr:'Nouveau Scan', zh:'新扫描', vi:'Quét mới', ko:'새 스캔', ht:'Nouvo Eskanè', ar:'مسح جديد' },
  download_report:  { en:'📄 Download Report', es:'📄 Descargar Informe', fr:'📄 Télécharger le Rapport', zh:'📄 下载报告', vi:'📄 Tải báo cáo', ko:'📄 보고서 다운로드', ht:'📄 Telechaje Rapò', ar:'📄 تحميل التقرير' },
  sign_in:          { en:'Sign In', es:'Iniciar Sesión', fr:'Se Connecter', zh:'登录', vi:'Đăng nhập', ko:'로그인', ht:'Konekte', ar:'تسجيل الدخول' },
  sign_out:         { en:'Sign Out', es:'Cerrar Sesión', fr:'Se Déconnecter', zh:'退出', vi:'Đăng xuất', ko:'로그아웃', ht:'Dekonekte', ar:'تسجيل الخروج' },
  my_plans:         { en:'My Plans', es:'Mis Planes', fr:'Mes Plans', zh:'我的计划', vi:'Kế hoạch của tôi', ko:'내 계획', ht:'Plan Mwen yo', ar:'خططي' },
  service_center:   { en:'A USDA NRCS Service Center', es:'Un Centro de Servicio USDA NRCS', fr:'Un Centre de Service USDA NRCS', zh:'USDA NRCS 服务中心', vi:'Trung tâm dịch vụ USDA NRCS', ko:'USDA NRCS 서비스 센터', ht:'Yon Sant Sèvis USDA NRCS', ar:'مركز خدمة USDA NRCS' },
  quick_access:     { en:'Quick Access', es:'Acceso Rápido', fr:'Accès Rapide', zh:'快速访问', vi:'Truy cập nhanh', ko:'빠른 접근', ht:'Aksè Rapid', ar:'وصول سريع' },
  resource_dir:     { en:'Resource Directory', es:'Directorio de Recursos', fr:'Répertoire des Ressources', zh:'资源目录', vi:'Danh mục tài nguyên', ko:'리소스 디렉토리', ht:'Repètwè Resous', ar:'دليل الموارد' },
  listen:           { en:'✨ Listen', es:'✨ Escuchar', fr:'✨ Écouter', zh:'✨ 收听', vi:'✨ Nghe', ko:'✨ 듣기', ht:'✨ Koute', ar:'✨ استمع' },
  concerns_label:   { en:'Detected Concerns', es:'Preocupaciones Detectadas', fr:'Problèmes Détectés', zh:'检测到的关注点', vi:'Mối quan ngại', ko:'감지된 우려 사항', ht:'Pwoblèm Detekte', ar:'مخاوف مكتشفة' },
  practices_label:  { en:'Matching Practices', es:'Prácticas Coincidentes', fr:'Pratiques Correspondantes', zh:'匹配实践', vi:'Thực hành phù hợp', ko:'일치하는 관행', ht:'Pratik Ki Koresponn', ar:'ممارسات مطابقة' },
  conservation_plan:{ en:'Draft Conservation Plan', es:'Borrador del Plan de Conservación', fr:'Ébauche du Plan de Conservation', zh:'保护计划草案', vi:'Dự thảo kế hoạch bảo tồn', ko:'보전 계획 초안', ht:'Plan Konsèvasyon Bwouyon', ar:'مسودة خطة الحفظ' },
  tagged_data:      { en:'Tagged Data & Sources', es:'Datos Etiquetados y Fuentes', fr:'Données Étiquetées et Sources', zh:'标记数据和来源', vi:'Dữ liệu được gắn thẻ', ko:'태그된 데이터', ht:'Done Make ak Sous', ar:'البيانات المصنّفة' },
  walkthroughs:     { en:'Practice Walkthroughs', es:'Guías de Prácticas', fr:'Guides Pratiques', zh:'实践指南', vi:'Hướng dẫn thực hành', ko:'실습 안내', ht:'Gid Pratik', ar:'إرشادات تطبيقية' },
  next_steps:       { en:'Recommended Next Steps', es:'Próximos Pasos', fr:'Prochaines Étapes', zh:'建议后续步骤', vi:'Bước tiếp theo', ko:'다음 단계', ht:'Pwochen Etap', ar:'الخطوات التالية' },
  ai_summary:       { en:'AI Strategic Summary', es:'Resumen Estratégico de IA', fr:'Résumé Stratégique IA', zh:'AI战略摘要', vi:'Tóm tắt chiến lược AI', ko:'AI 전략 요약', ht:'Rezime Estratejik IA', ar:'ملخص استراتيجي' },
  zone_legend:      { en:'Zone Legend', es:'Leyenda de Zonas', fr:'Légende des Zones', zh:'区域图例', vi:'Chú giải vùng', ko:'구역 범례', ht:'Lejand Zòn', ar:'مفتاح المناطق' },
  generate_vision:  { en:'🎨 Generate Master Plan Vision', es:'🎨 Generar Visión del Plan', fr:'🎨 Générer la Vision du Plan', zh:'🎨 生成规划愿景', vi:'🎨 Tạo tầm nhìn', ko:'🎨 비전 생성', ht:'🎨 Jenere Vizyon Plan', ar:'🎨 إنشاء رؤية الخطة' },
  vision_title:     { en:'Farm Master Plan Vision', es:'Visión del Plan Maestro', fr:'Vision du Plan Directeur', zh:'农场规划愿景', vi:'Tầm nhìn quy hoạch', ko:'마스터 플랜 비전', ht:'Vizyon Plan Mèt', ar:'رؤية الخطة الرئيسية' },
  vision_generating:{ en:'Generating conceptual vision...', es:'Generando visión conceptual...', fr:'Génération de la vision...', zh:'正在生成愿景...', vi:'Đang tạo tầm nhìn...', ko:'비전 생성 중...', ht:'Ap jenere vizyon...', ar:'جارٍ إنشاء الرؤية...' },
  vision_desc:      { en:'AI-generated conceptual rendering of your farm after conservation implementation', es:'Representación conceptual IA', fr:'Rendu conceptuel IA', zh:'AI概念效果图', vi:'Hình ảnh khái niệm AI', ko:'AI 개념 렌더링', ht:'Reyalizasyon konseptiyèl IA', ar:'تصور مفاهيمي بالذكاء الاصطناعي' },
  apply_eqip:       { en:'Apply for EQIP Funding →', es:'Solicitar Fondos EQIP →', fr:'Demander EQIP →', zh:'申请EQIP资助 →', vi:'Đăng ký EQIP →', ko:'EQIP 신청 →', ht:'Aplike pou EQIP →', ar:'التقدم لتمويل EQIP →' },
  login_title:      { en:'Sign In to Save Progress', es:'Inicie Sesión para Guardar', fr:'Connectez-vous pour Sauvegarder', zh:'登录以保存进度', vi:'Đăng nhập để lưu', ko:'로그인하여 저장', ht:'Konekte pou Sove', ar:'سجّل الدخول للحفظ' },
  login_google:     { en:'Sign in with Google', es:'Iniciar con Google', fr:'Se connecter avec Google', zh:'使用Google登录', vi:'Đăng nhập bằng Google', ko:'Google로 로그인', ht:'Konekte ak Google', ar:'الدخول بـ Google' },
  login_email_ph:   { en:'Email address', es:'Correo electrónico', fr:'Adresse e-mail', zh:'电子邮件', vi:'Địa chỉ email', ko:'이메일', ht:'Adrès imèl', ar:'البريد الإلكتروني' },
  login_pass_ph:    { en:'Password', es:'Contraseña', fr:'Mot de passe', zh:'密码', vi:'Mật khẩu', ko:'비밀번호', ht:'Modpas', ar:'كلمة المرور' },
  login_submit:     { en:'Sign In / Register', es:'Iniciar / Registrar', fr:'Connecter / Inscrire', zh:'登录/注册', vi:'Đăng nhập/Đăng ký', ko:'로그인/등록', ht:'Konekte/Anrejistre', ar:'دخول/تسجيل' },
  footer_disclaimer:{ en:'USDA is an equal opportunity provider, employer, and lender. This is a digital assistance tool operated by NCsmall.farm. For official information, visit ', es:'USDA es un proveedor de igualdad de oportunidades. Para información oficial, visite ', fr:'L\'USDA offre l\'égalité des chances. Pour les informations officielles, visitez ', zh:'USDA是机会均等的提供者。如需官方信息，请访问 ', vi:'USDA là nhà cung cấp bình đẳng. Thông tin chính thức tại ', ko:'USDA는 평등한 기회 제공자입니다. 공식 정보: ', ht:'USDA se yon founisè opòtinite egal. Pou enfòmasyon ofisyèl, vizite ', ar:'USDA مزودة متساوية للفرص. للمعلومات الرسمية: ' },
  ppgis_title:      { en:'Field Survey Mode', es:'Modo de Encuesta de Campo', fr:'Mode Relevé de Terrain', zh:'现场调查模式', vi:'Chế độ khảo sát thực địa', ko:'현장 조사 모드', ht:'Mòd Sondaj Teren', ar:'وضع المسح الميداني' },
  ppgis_scan:       { en:'Scan My Farm', es:'Escanear Mi Finca', fr:'Scanner Ma Ferme', zh:'扫描我的农场', vi:'Quét nông trại', ko:'농장 스캔', ht:'Eskane Fèm Mwen', ar:'مسح مزرعتي' },
  ppgis_photo:      { en:'📷 Take Photo', es:'📷 Tomar Foto', fr:'📷 Prendre Photo', zh:'📷 拍照', vi:'📷 Chụp ảnh', ko:'📷 사진 촬영', ht:'📷 Pran Foto', ar:'📷 التقاط صورة' },
  ppgis_annotate:   { en:'📍 Add Note', es:'📍 Agregar Nota', fr:'📍 Ajouter Note', zh:'📍 添加备注', vi:'📍 Thêm ghi chú', ko:'📍 메모 추가', ht:'📍 Ajoute Nòt', ar:'📍 إضافة ملاحظة' },

  // Navigation tabs
  nav_services:     { en:'Services', es:'Servicios', fr:'Services', zh:'服务', vi:'Dịch vụ', ko:'서비스', ht:'Sèvis', ar:'الخدمات' },
  nav_about:        { en:'About', es:'Acerca de', fr:'À Propos', zh:'关于', vi:'Giới thiệu', ko:'소개', ht:'Sou', ar:'حول' },
  nav_faq:          { en:'FAQ', es:'Preguntas Frecuentes', fr:'FAQ', zh:'常见问题', vi:'Câu hỏi', ko:'자주 묻는 질문', ht:'FAQ', ar:'أسئلة شائعة' },
  nav_contact:      { en:'Contact', es:'Contacto', fr:'Contact', zh:'联系', vi:'Liên hệ', ko:'연락처', ht:'Kontak', ar:'تواصل' },
  nav_projects:     { en:'Projects', es:'Proyectos', fr:'Projets', zh:'项目', vi:'Dự án', ko:'프로젝트', ht:'Pwojè', ar:'مشاريع' },
  nav_people:       { en:'People', es:'Personas', fr:'Personnes', zh:'人员', vi:'Con người', ko:'사람들', ht:'Moun', ar:'الأشخاص' },
  nav_resources:    { en:'Resources', es:'Recursos', fr:'Ressources', zh:'资源', vi:'Tài nguyên', ko:'자료', ht:'Resous', ar:'الموارد' },
  nav_mapview:      { en:'Map View', es:'Vista de Mapa', fr:'Vue Carte', zh:'地图视图', vi:'Xem bản đồ', ko:'지도 보기', ht:'Vi Kat', ar:'عرض الخريطة' },
  nav_planner:      { en:'Farm Planner', es:'Planificador', fr:'Planificateur', zh:'农场规划师', vi:'Kế hoạch', ko:'농장 플래너', ht:'Planifikatè', ar:'مخطط المزرعة' },

  // Chat UI
  back_assistants:  { en:'← Virtual Assistants', es:'← Asistentes Virtuales', fr:'← Assistants Virtuels', zh:'← 虚拟助手', vi:'← Trợ lý ảo', ko:'← 가상 어시스턴트', ht:'← Asistan Vityèl', ar:'← المساعدون الافتراضيون' },
  chat_with:        { en:'Chat with {name}', es:'Chatear con {name}', fr:'Discussion avec {name}', zh:'与{name}交流', vi:'Trò chuyện với {name}', ko:'{name}와 채팅', ht:'Chatte ak {name}', ar:'محادثة مع {name}' },
  pathway_label:    { en:'Pathway Steps', es:'Pasos del Recorrido', fr:'Étapes du Parcours', zh:'路径步骤', vi:'Bước lộ trình', ko:'경로 단계', ht:'Etap Chemen', ar:'خطوات المسار' },
  resources_label:  { en:'Resources', es:'Recursos', fr:'Ressources', zh:'资源', vi:'Tài nguyên', ko:'자료', ht:'Resous', ar:'الموارد' },
  click_complete:   { en:'Click to complete', es:'Haga clic para completar', fr:'Cliquez pour compléter', zh:'点击完成', vi:'Nhấp để hoàn thành', ko:'클릭하여 완료', ht:'Klike pou fini', ar:'انقر للإكمال' },
  help_placeholder: { en:'Tell us how we can help.', es:'Cuéntenos cómo podemos ayudar.', fr:'Dites-nous comment nous aider.', zh:'告诉我们如何帮助您。', vi:'Hãy cho chúng tôi biết cách giúp bạn.', ko:'어떻게 도와드릴지 알려주세요.', ht:'Di nou kijan nou ka ede w.', ar:'أخبرنا كيف يمكننا المساعدة.' },
  hero_desc_sub:    { en:'Let us know below, or choose one of the assisted pathways below.', es:'Háganos saber a continuación o elija una de las vías asistidas.', fr:'Faites-nous savoir ci-dessous ou choisissez un parcours assisté.', zh:'在下面告诉我们，或选择一条辅助路径。', vi:'Cho chúng tôi biết bên dưới hoặc chọn một lộ trình hỗ trợ.', ko:'아래에 알려주시거나 지원 경로를 선택하세요.', ht:'Di nou anba a oswa chwazi youn nan chemen asiste yo.', ar:'أخبرنا أدناه أو اختر أحد المسارات المساعدة.' },
  find_local_office:{ en:'Find your local office →', es:'Encuentra tu oficina local →', fr:'Trouver votre bureau local →', zh:'查找您的当地办公室 →', vi:'Tìm văn phòng địa phương →', ko:'지역 사무소 찾기 →', ht:'Jwenn biwo lokal ou →', ar:'اعثر على مكتبك المحلي →' },
};

window.currentLang = 'en';

/**
 * Translate a key with optional variable interpolation.
 * @param {string} key - Translation key
 * @param {Object} vars - Variables to interpolate (e.g., {name: 'Barbara'})
 * @returns {string} Translated string
 */
window.t = function(key, vars = {}) {
  let str = TRANSLATIONS[key]?.[currentLang] || TRANSLATIONS[key]?.en || key;
  for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, v);
  return str;
};
