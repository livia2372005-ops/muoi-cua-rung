window.MuoiCuaRung = window.MuoiCuaRung || {};

window.MuoiCuaRung.DATA = {
  tracks: [
    {
      id: 'loi-mo-dau',
      shortTitle: 'Lời mở đầu & Tác giả',
      pageLabel: 'Trang 2–3',
      pageStart: 1,
      audioCandidates: ['./audio/loi-mo-dau.mp3', './audio/loi-mo-dau.m4a'],
    },
    {
      id: 'tom-tat',
      shortTitle: 'Sơ đồ hành trình (5 chương)',
      pageLabel: 'Trang 4–5',
      pageStart: 3,
      audioCandidates: ['./audio/tom-tat.mp3', './audio/tom-tat.m4a'],
    },
    {
      id: 'chuong-1',
      shortTitle: 'Chương I — Vào Rừng Dâu Da Mùa Xuân',
      pageLabel: 'Trang 7–8',
      pageStart: 6,
      audioCandidates: ['./audio/chuong-1.mp3', './audio/chuong-1.m4a'],
    },
    {
      id: 'chuong-2',
      shortTitle: 'Chương II — Bờ Vực Hõm Chết',
      pageLabel: 'Trang 10–11',
      pageStart: 9,
      audioCandidates: ['./audio/chuong-2.mp3', './audio/chuong-2.m4a'],
    },
    {
      id: 'chuong-3',
      shortTitle: 'Chương III — Khoảnh Khắc Thức Tỉnh',
      pageLabel: 'Trang 13–15',
      pageStart: 12,
      audioCandidates: ['./audio/chuong-3.mp3', './audio/chuong-3.m4a'],
    },
    {
      id: 'chuong-4',
      shortTitle: 'Chương IV — Mưa Xuân & Hoa Tử Huyền',
      pageLabel: 'Trang 16–17',
      pageStart: 15,
      audioCandidates: ['./audio/chuong-4.mp3', './audio/chuong-4.m4a'],
    },
    {
      id: 'chuong-5',
      shortTitle: 'Chương V — Tước Bỏ Để Tái Sinh',
      pageLabel: 'Trang 18–19',
      pageStart: 17,
      audioCandidates: ['./audio/chuong-5.mp3', './audio/chuong-5.m4a'],
    },
    {
      id: 'ket-luan',
      shortTitle: 'Hệ biểu tượng & Dư âm thi pháp',
      pageLabel: 'Trang 20–21',
      pageStart: 19,
      audioCandidates: ['./audio/ket-luan.mp3', './audio/ket-luan.m4a'],
    },
  ],

  nodes: [
    {
      step: 'I',
      phase: 'Khởi đầu',
      targetPage: 5,
      title: 'Vào Rừng Dâu Da Mùa Xuân',
      image: './assets/images/plate-01-khoi-hanh.jpg',
      detailText:
        'Sau Tết một tháng, ông Diểu tuổi sáu mươi mang súng hai nòng, áo ấm, mũ lông, giày cao cổ và nắm xôi tiến vào rừng săn khỉ với tâm thế tự tin bề trên.',
      voiceScript:
        'Chương một, Khởi đầu — Vào rừng dâu da mùa xuân: Vào tiết mưa bụi một tháng sau Tết, ông Diểu mang súng hai nòng, áo ấm, mũ lông, giày cao cổ và nắm xôi bước vào khu rừng săn khỉ với tâm thế kiêu hãnh.',
    },
    {
      step: 'II',
      phase: 'Biến cố',
      targetPage: 8,
      title: 'Bờ Vực Hõm Chết',
      image: './assets/images/thumb-02-monkeys.jpg',
      detailText:
        'Ông bắn gục khỉ đực; khỉ cái quay lại cứu chồng bị mắng là giả dối; khỉ con túm dây đeo súng kéo chạy rồi rơi thẳng xuống đáy vực Hõm Chết mù sương.',
      voiceScript:
        'Chương hai, Biến cố — Bờ vực Hõm Chết: Tiếng súng xé tan sự tĩnh lặng của rừng xuân. Khỉ con bất ngờ túm dây đeo khẩu súng kéo chạy tới mép vực Hõm Chết rồi rơi thẳng xuống đáy vực sâu.',
    },
    {
      step: 'III',
      phase: 'Bước ngoặt',
      targetPage: 11,
      title: 'Khoảnh Khắc Thức Tỉnh',
      image: './assets/images/thumb-03-eyes.jpg',
      detailText:
        'Cởi giày và áo ngoài vắt lên chạc cây duối để leo vách đá, chạm vào thân thể nóng hầm hập và ánh mắt cầu khẩn của khỉ đực, ông Diểu bừng tỉnh lương tri.',
      voiceScript:
        'Chương ba, Bước ngoặt — Khoảnh khắc thức tỉnh: Leo vách đá chạm vào thân thể nóng hầm hập và ánh mắt cầu xin của khỉ đực bị thương, ông Diểu sững sờ gạt bỏ tham vọng săn bắt.',
    },
    {
      step: 'IV',
      phase: 'Kết tinh',
      targetPage: 15,
      title: 'Mưa Xuân & Hoa Tử Huyền',
      image: './assets/images/thumb-04-care.jpg',
      detailText:
        'Nhai cỏ Lào đắp vết thương, cởi quần lót băng bó rồi phóng sinh khỉ đực giữa trận núi lở. Trần truồng rẽ lối bụi gai ra về, ông gặp bạt ngàn hoa tử huyền.',
      voiceScript:
        'Chương bốn, Kết tinh — Mưa xuân và hoa tử huyền: Tự nguyện cởi nốt mảnh vải cuối cùng để cứu rồi thả khỉ đực, ông Diểu trần truồng bước về trong mưa xuân và bắt gặp hoa tử huyền trắng xóa.',
    },
    {
      step: 'V',
      phase: 'Tổng luận',
      targetPage: 17,
      title: 'Tước Bỏ Để Tái Sinh',
      image: './assets/images/detail-hoa-tu-huyen.jpg',
      detailText:
        'Từ bị thiên nhiên tước đoạt vũ khí đến tự nguyện trút bỏ lớp vỏ văn minh giả tạo, con người tìm lại bản thể thanh sạch và đón nhận điềm lành muối của rừng.',
      voiceScript:
        'Chương năm, Tổng luận — Tước bỏ để tái sinh: Khi con người từ bỏ tham vọng chế ngự tự nhiên để hành xử bằng lòng trắc ẩn, phần nhân tính tinh sạch nhất sẽ tự khắc hồi sinh.',
    },
  ],
};
