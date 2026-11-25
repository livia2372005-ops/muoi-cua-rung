export const BOOK_CONFIG = {
  title: 'Muối Của Rừng',
  subtitle: 'Sách điện tử tương tác — Ngữ văn 12',
  author: 'Nguyễn Huy Thiệp',
  year: '1986',
  groupName: 'Nhóm 3',
  classPromptTitle: 'Sách điện tử tác phẩm Muối của rừng',
  audioPaths: [
    './audio/tom-tat.mp3',
    './audio/tom-tat.m4a',
    './audio/tom-tat.wav',
    './audio/tom-tat.ogg',
  ],
  coverImage: './assets/cover-forest.svg',
  flowerImage: './assets/hoa-tu-huyen.svg',
};

export const AUTHOR_WORK_INFO = {
  authorName: 'Nguyễn Huy Thiệp (1950 – 2021)',
  authorBio:
    'Sinh tại Hà Nội, quê gốc ở huyện Thanh Trì. Ông là cây bút truyện ngắn tiêu biểu bậc nhất của văn học Việt Nam thời kỳ Đổi mới, nổi bật với lối văn cô đọng, sắc sảo, giàu tính triết lý nhân sinh và chiều sâu biểu tượng.',
  workOrigin:
    'Truyện ngắn sáng tác năm 1986, lấy bối cảnh núi rừng đá vôi vào tiết xuân ấm ẩm sau Tết Nguyên đán khoảng một tháng.',
  narrativeView:
    'Truyện kể ở ngôi thứ ba, điểm nhìn chủ yếu đặt qua nhận thức và tâm trạng của nhân vật ông Diểu, giúp phơi bày sắc nét cuộc đấu tranh nội tâm giữa bản năng chiếm hữu và phần nhân tính thiện lương.',
  coreMessage:
    'Khi con người từ bỏ tham vọng chinh phục ngạo mạn để tôn trọng và hòa hợp với thiên nhiên, phần "người" thanh sạch nhất sẽ được đánh thức và đón nhận "muối của rừng" — tinh hoa bình yên của đất trời.',
};

export const SUMMARY_NODES = [
  {
    id: 'khoi-dau',
    step: 1,
    phase: 'Mở đầu',
    title: 'Khởi đầu chuyến đi săn',
    shortText:
      'Mùa xuân sau Tết, ông Diểu (60 tuổi) mang khẩu súng hai nòng vào rừng dâu da săn khỉ với tâm thế tự tin, kiêu hãnh.',
    detailText:
      'Vào một ngày mưa phùn mùa xuân ấm áp, ông Diểu mang theo khẩu súng hai nòng tối tân (món quà người con trai đi học nước ngoài gửi biếu), mặc quần áo ấm, đội mũ lông và mang nắm xôi nếp. Ông bước vào khu rừng dâu da với tư thế kẻ đi chinh phục tự nhiên.',
    quote: '“Ông Diểu mang khẩu súng hai nòng... đi săn vào mùa xuân.”',
    voiceScript:
      'Chặng một, khởi đầu chuyến đi săn. Vào tiết mưa xuân một tháng sau Tết, ông Diểu ở tuổi sáu mươi mang theo khẩu súng hai nòng tối tân do con trai gửi biếu cùng quần áo ấm và nắm xôi nếp, kiêu hãnh tiến vào khu rừng dâu da để săn khỉ.',
    startRatio: 0.0,
    endRatio: 0.19,
  },
  {
    id: 'phat-sung',
    step: 2,
    phase: 'Biến cố',
    title: 'Phát súng & Bi kịch ở Hõm Chết',
    shortText:
      'Ông bắn hạ khỉ đực đầu đàn; khỉ cái quay lại cứu chồng; khỉ con cướp súng rồi rơi xuống vực Hõm Chết.',
    detailText:
      'Phát hiện gia đình ba con khỉ, ông Diểu nổ súng bắn hạ con khỉ đực. Khi khỉ cái liều mình quay lại đỡ chồng, ông vẫn nhìn bằng thái độ ích kỷ, hoài nghi. Bất ngờ, con khỉ con lao tới giật khẩu súng hai nòng khiến cả người lẫn súng trượt xuống vực sâu Hõm Chết trong tiếng kêu thảm thiết.',
    quote: '“Khỉ con lao tới ôm súng, cùng rơi xuống vực Hõm Chết...”',
    voiceScript:
      'Chặng hai, phát súng và bi kịch ở Hõm Chết. Ông Diểu bắn ngã con khỉ đực đầu đàn. Khỉ cái không bỏ chạy mà liều mình quay lại cứu chồng, khiến ông vừa bực tức vừa kinh ngạc. Giữa lúc ấy, con khỉ con xông ra cướp khẩu súng hai nòng rồi cùng khẩu súng rơi xuống vực sâu Hõm Chết.',
    startRatio: 0.19,
    endRatio: 0.41,
  },
  {
    id: 'thuc-tinh',
    step: 3,
    phase: 'Bước ngoặt',
    title: 'Bám đuổi & Thức tỉnh lương tri',
    shortText:
      'Cởi bỏ áo ngoài để trèo lên vách đá bắt khỉ đực, ông Diểu bàng hoàng trước ánh mắt cầu khẩn của con vật.',
    detailText:
      'Dù vừa hoảng sợ vừa mất súng, sự cay cú vẫn thôi thúc ông Diểu cởi bỏ quần áo ngoài dưới chân núi để leo lên mỏm đá bắt sống khỉ đực. Khi đối diện với con vật đang run rẩy, bị thương nặng và đưa đôi mắt cầu xin thảm thiết, lòng trắc ẩn trong ông bỗng bừng tỉnh.',
    quote: '“Đôi mắt con khỉ đực nhìn ông cầu khẩn, run rẩy đau đớn.”',
    voiceScript:
      'Chặng ba, bám đuổi và thức tỉnh lương tri. Cởi bỏ quần áo ngoài dưới chân núi, ông Diểu leo lên mỏm đá tìm bắt con khỉ đực. Nhưng khi trực tiếp nhìn thấy con vật bị thương nặng đang run rẩy đưa đôi mắt cầu xin tha thiết, trái tim ông chấn động và lòng trắc ẩn đã trỗi dậy.',
    startRatio: 0.41,
    endRatio: 0.63,
  },
  {
    id: 'cuu-chua',
    step: 4,
    phase: 'Chuyển hóa',
    title: 'Cứu chữa & Buông bỏ',
    shortText:
      'Ông nhai lá đắp thuốc, lấy quần lót băng bó cho khỉ đực, rồi thả nó về rừng trước tình nghĩa của khỉ cái.',
    detailText:
      'Ông Diểu tìm lá rừng nhai kỹ đắp vết thương, cởi nốt chiếc quần lót duy nhất để băng cầm máu cho khỉ đực rồi bế nó xuống núi. Xuống tới nơi, quần áo và nắm xôi đã bị tổ mối đùn đất lấp kín; cảm động trước khỉ cái vẫn lặng lẽ đi theo chờ đợi, ông buông tha cho khỉ đực trở về với gia đình.',
    quote: '“Ông cởi chiếc quần lót băng vết thương cho con khỉ rồi thả nó đi.”',
    voiceScript:
      'Chặng bốn, cứu chữa và buông bỏ. Ông Diểu tìm lá đắp cầm máu và cởi nốt chiếc quần lót duy nhất để băng cho khỉ đực rồi bế nó xuống núi. Khi thấy bộ quần áo và nắm xôi đã bị mối đùn lấp kín, lại thấy khỉ cái kiên trì đi theo sau, ông quyết định phóng sinh con khỉ đực.',
    startRatio: 0.63,
    endRatio: 0.84,
  },
  {
    id: 'hoa-tu-huyen',
    step: 5,
    phase: 'Kết tinh',
    title: 'Gặp hoa tử huyền — "Muối của rừng"',
    shortText:
      'Trần truồng trở về trong mưa xuân thanh sạch, ông Diểu gặp hoa tử huyền nở rộ — điềm lành của thiên nhiên.',
    detailText:
      'Trải qua hành trình rũ bỏ mọi lớp vỏ vật chất giả tạo, ông Diểu trần truồng bước về giữa màn mưa xuân dịu ấm. Ven lối đi đầy bụi gai, ông ngỡ ngàng bắt gặp hoa tử huyền trắng muốt nở rộ — loài hoa ba mươi năm mới nở một lần, được gọi là "muối của rừng", báo hiệu đất nước thanh bình, mùa màng phong túc.',
    quote: '“Hoa này màu trắng, vị mặn... người ta gọi là muối của rừng.”',
    voiceScript:
      'Chặng năm, gặp hoa tử huyền, muối của rừng. Trở về trong mưa xuân với cơ thể trần trụi nhưng tâm hồn hoàn toàn thanh lọc, ông Diểu bất ngờ bắt gặp hoa tử huyền trắng muốt ba mươi năm mới nở một lần — như món quà thiêng liêng của đất trời dành tặng cho người biết quay về với thiện lương.',
    startRatio: 0.84,
    endRatio: 1.0,
  },
];

export const HUNTING_STAGES = [
  {
    stage: 1,
    shortLabel: '1. Vào rừng',
    title: 'Bước vào rừng với tâm thế kẻ chinh phục',
    location: 'Rừng dâu da mùa xuân',
    outerAction:
      'Ông Diểu (60 tuổi) chuẩn bị kỹ lưỡng như một thợ săn thực thụ: mang khẩu súng hai nòng hiện đại (quà của con trai du học gửi về), mặc quần áo ấm, đội mũ lông và đem theo nắm xôi nếp.',
    strippedAway: 'Chưa mất gì — trang bị đầy đủ biểu tượng của văn minh và vật chất.',
    innerPsychology:
      'Tự tin, kiêu hãnh, mang cái nhìn trịch thượng của con người tự đặt mình lên trên muôn loài; coi việc đi săn là thú vui khẳng định uy quyền.',
    quote: '“Ông cảm thấy mình như một vị chúa tể giữa khu rừng mùa xuân đầy nhựa sống.”',
    arroganceScore: 95,
    humanityScore: 20,
  },
  {
    stage: 2,
    shortLabel: '2. Hõm Chết',
    title: 'Nổ súng và cú sốc tại vực Hõm Chết',
    location: 'Vách đá & Vực sâu Hõm Chết',
    outerAction:
      'Ông bắn ngã con khỉ đực đầu đàn. Khi khỉ cái quay lại đỡ chồng, ông xua đuổi nó. Khỉ con xông ra cướp khẩu súng hai nòng rồi cùng rơi xuống vực sâu Hõm Chết.',
    strippedAway: 'Mất khẩu súng hai nòng — vũ khí bạo lực và biểu tượng uy quyền văn minh bị thiên nhiên thu giữ.',
    innerPsychology:
      'Từ sự ích kỷ, hoài nghi tình cảm loài vật ("đồ giả dối, làm bộ") chuyển sang kinh hoàng, sợ hãi cực độ, bỏ chạy thục mạng như ma đuổi trước cơn giận dữ của núi rừng.',
    quote: '“Con khỉ con ôm chặt khẩu súng lao xuống vực sâu, tiếng kêu thảm thiết dội vào vách đá.”',
    arroganceScore: 68,
    humanityScore: 38,
  },
  {
    stage: 3,
    shortLabel: '3. Mỏm đá',
    title: 'Trút bỏ áo ngoài & Chấn động lương tri',
    location: 'Mỏm đá cheo leo trên cao',
    outerAction:
      'Vì cay cú không muốn về tay không, ông cởi bỏ bộ quần áo ấm, mũ lông và lương thực dưới gốc cây để nhẹ người leo lên vách đá đuổi bắt con khỉ đực đang bị thương.',
    strippedAway: 'Cởi bỏ quần áo ngoài, mũ lông — rũ bỏ lớp trang phục tiện nghi, chỉ còn bộ đồ lót bám vách đá.',
    innerPsychology:
      'Khi đối diện trực tiếp với con khỉ đực đang hấp hối, đôi mắt run rẩy nhìn ông như cầu khẩn, tham vọng săn bắt tan biến nhường chỗ cho niềm xót thương và sự thức tỉnh phần "người".',
    quote: '“Ông Diểu sững sờ... lòng trắc ẩn bỗng trỗi dậy mạnh mẽ trước ánh mắt cầu xin của con vật.”',
    arroganceScore: 34,
    humanityScore: 72,
  },
  {
    stage: 4,
    shortLabel: '4. Tổ mối đùn',
    title: 'Cứu chữa, mất nốt tài sản & Phóng sinh',
    location: 'Chân núi đá vôi',
    outerAction:
      'Ông nhai lá đắp vết thương, cởi nốt chiếc quần lót duy nhất băng cầm máu cho khỉ đực rồi bế nó xuống núi. Xuống tới chân núi, ông thấy bộ quần áo và nắm xôi đã bị mối đùn lấp kín.',
    strippedAway: 'Mất nốt chiếc quần lót cuối cùng và nắm xôi nếp — thiên nhiên tước sạch dấu vết vật chất còn lại.',
    innerPsychology:
      'Đấu tranh nội tâm ngắn ngủi giữa giữ lại hay thả đi; cuối cùng, tình nghĩa thủy chung của khỉ cái đi theo sau đã giúp thiên lương chiến thắng hoàn toàn, ông trả tự do cho khỉ đực.',
    quote: '“Tổ mối đùn đất lên phủ kín bộ quần áo... Ông lặng lẽ đặt con khỉ xuống cho nó đi.”',
    arroganceScore: 10,
    humanityScore: 92,
  },
  {
    stage: 5,
    shortLabel: '5. Tử huyền',
    title: 'Trở về trần truồng & Gặp hoa tử huyền',
    location: 'Lối mòn ra khỏi rừng trong mưa xuân',
    outerAction:
      'Ông Diểu hoàn toàn trần truồng đi dưới làn mưa xuân mịn màng. Trên lối mòn đầy bụi gai về nhà, ông ngỡ ngàng bắt gặp khóm hoa tử huyền trắng muốt nở rộ.',
    strippedAway: 'Trần trụi hoàn toàn về vật chất — trở về bản thể nguyên sơ, bình đẳng trước tự nhiên.',
    innerPsychology:
      'Tâm hồn được thanh tẩy nhẹ nhõm, không còn mặc cảm hay tham sân si. Việc gặp "muối của rừng" là sự công nhận và ban phúc của thiên nhiên dành cho lòng thiện lương.',
    quote: '“Mưa xuân dịu dàng. Người ta nói khi rừng kết muối là điềm báo đất nước thanh bình.”',
    arroganceScore: 0,
    humanityScore: 100,
  },
];

export const SYMBOLS_LIST = [
  {
    title: 'Khẩu súng hai nòng',
    tag: 'Văn minh & Bạo lực',
    meaning:
      'Hiện thân cho sự ngạo mạn, tham vọng dùng sức mạnh kỹ thuật để chế ngự và tàn phá tự nhiên. Việc khẩu súng rơi xuống vực sâu là lời cảnh tỉnh về giới hạn của con người.',
  },
  {
    title: 'Vực Hõm Chết',
    tag: 'Ranh giới lương tri',
    meaning:
      'Không gian thẳm sâu, mù sương nơi năm nào cũng có người bỏ mạng — biểu tượng cho vực thẳm tội lỗi buộc ông Diểu phải dừng lại và đối diện với chính nỗi sợ của mình.',
  },
  {
    title: 'Tổ mối đùn & Sự trần truồng',
    tag: 'Tái sinh tinh thần',
    meaning:
      'Thiên nhiên thu hồi lại quần áo, đồ ăn để tước bỏ lớp vỏ giả tạo của thói đời. Sự "trần truồng" ở cuối truyện là trạng thái tinh khôi khi con người thực sự hòa nhập cùng đất trời.',
  },
  {
    title: 'Hoa tử huyền — Muối của rừng',
    tag: 'Tinh hoa & Thiện lương',
    meaning:
      'Loài hoa màu trắng, vị mặn, bé bằng đầu tăm và 30 năm mới nở một lần. Đó là "muối" kết tinh của rừng già — phần thưởng thiêng liêng cho lòng trắc ẩn và khát vọng sống hài hòa.',
  },
];
