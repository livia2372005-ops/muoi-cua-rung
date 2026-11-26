window.MuoiCuaRung = window.MuoiCuaRung || {};

window.MuoiCuaRung.DATA = {
  tracks: [
    {
      id: 'loi-mo-dau',
      shortTitle: 'Lời mở đầu',
      pageLabel: 'Trang 2',
      pageStart: 1,
      audioCandidates: ['./audio/loi-mo-dau.mp3', './audio/loi-mo-dau.m4a'],
    },
    {
      id: 'tom-tat',
      shortTitle: 'Sơ đồ tóm tắt (5 chặng)',
      pageLabel: 'Trang 4–5',
      pageStart: 3,
      audioCandidates: ['./audio/tom-tat.mp3', './audio/tom-tat.m4a'],
    },
    {
      id: 'chuong-1',
      shortTitle: 'Chương I — Tâm thế kẻ chinh phục',
      pageLabel: 'Trang 7–8',
      pageStart: 6,
      audioCandidates: ['./audio/chuong-1.mp3', './audio/chuong-1.m4a'],
    },
    {
      id: 'chuong-2',
      shortTitle: 'Chương II — Tiếng hú nơi bờ vực',
      pageLabel: 'Trang 10–11',
      pageStart: 9,
      audioCandidates: ['./audio/chuong-2.mp3', './audio/chuong-2.m4a'],
    },
    {
      id: 'chuong-3',
      shortTitle: 'Chương III — Cỏ Lào & Phóng sinh',
      pageLabel: 'Trang 13–15',
      pageStart: 12,
      audioCandidates: ['./audio/chuong-3.mp3', './audio/chuong-3.m4a'],
    },
    {
      id: 'chuong-4',
      shortTitle: 'Chương IV — Sắc trắng hoa tử huyền',
      pageLabel: 'Trang 16',
      pageStart: 15,
      audioCandidates: ['./audio/chuong-4.mp3', './audio/chuong-4.m4a'],
    },
    {
      id: 'chuong-5',
      shortTitle: 'Chương V — Tước bỏ để tái sinh',
      pageLabel: 'Trang 18–19',
      pageStart: 17,
      audioCandidates: ['./audio/chuong-5.mp3', './audio/chuong-5.m4a'],
    },
    {
      id: 'ket-luan',
      shortTitle: 'Biểu tượng & Dư âm thi pháp',
      pageLabel: 'Trang 20–21',
      pageStart: 19,
      audioCandidates: ['./audio/ket-luan.mp3', './audio/ket-luan.m4a'],
    },
  ],

  nodes: [
    {
      step: 1,
      phase: 'Mở đầu',
      title: 'Vào rừng dâu da mùa xuân',
      image: './assets/images/plate-01-khoi-hanh.jpg',
      detailText:
        'Sau Tết một tháng, ông Diểu (60 tuổi) mang khẩu súng hai nòng con trai gửi từ nước ngoài, mặc áo ấm, đội mũ lông, đi giày cao cổ và mang nắm xôi tiến vào rừng dâu da săn khỉ.',
      voiceScript:
        'Chặng một, mở đầu: Vào tiết mưa xuân một tháng sau Tết, ông Diểu ở tuổi sáu mươi mang theo khẩu súng hai nòng tối tân, áo ấm, mũ lông, giày cao cổ và nắm xôi nếp tiến vào rừng dâu da săn khỉ với tâm thế kiêu hãnh.',
    },
    {
      step: 2,
      phase: 'Biến cố',
      title: 'Phát súng & Vực Hõm Chết',
      image: './assets/images/thumb-02-monkeys.jpg',
      detailText:
        'Ông bắn hạ khỉ đực đầu đàn; khỉ cái quay lại cứu chồng bị ông mắng là đồ gian dối. Con khỉ con túm dây đeo súng kéo lê chạy tới mép vực Hõm Chết rồi cùng rơi xuống vực sương mù.',
      voiceScript:
        'Chặng hai, biến cố: Ông bắn ngã khỉ đực đầu đàn; khỉ cái liều mình cứu chồng bị ông mắng là giả dối. Bất ngờ khỉ con túm dây đeo súng kéo chạy rồi rơi thẳng xuống vực sâu Hõm Chết.',
    },
    {
      step: 3,
      phase: 'Bước ngoặt',
      title: 'Ánh mắt cầu xin trên mỏm đá',
      image: './assets/images/thumb-03-eyes.jpg',
      detailText:
        'Ông cởi giày và áo ngoài vắt lên chạc cây duối để leo vách đá bắt khỉ đực. Khi chạm vào cơ thể nóng hầm hập và đôi mắt run rẩy cầu khẩn của con vật, lòng trắc ẩn trong ông bừng tỉnh.',
      voiceScript:
        'Chặng ba, bước ngoặt: Cởi giày và áo ngoài vắt lên chạc cây duối để trèo lên mỏm đá, ông Diểu sững sờ khi chạm vào cơ thể nóng hầm hập và ánh mắt cầu xin tha thiết của con khỉ bị thương.',
    },
    {
      step: 4,
      phase: 'Chuyển hóa',
      title: 'Nắm cỏ Lào, Núi lở & Phóng sinh',
      image: './assets/images/thumb-04-care.jpg',
      detailText:
        'Ông nhai nắm cỏ Lào đắp cầm máu, tự nguyện cởi chiếc quần lót duy nhất băng vết thương cho khỉ đực. Núi lở cuốn mất quần áo trên cây duối, đống mối đùn lấp mũ xôi; cảm động trước khỉ cái bám theo, ông thả khỉ đực.',
      voiceScript:
        'Chặng bốn, chuyển hóa: Ông nhai nắm cỏ Lào đắp thuốc và tự nguyện cởi chiếc quần lót duy nhất băng cho khỉ đực. Núi lở cuốn cây duối, đống mối đùn lấp mũ xôi; cảm động trước tình nghĩa khỉ cái, ông phóng sinh khỉ đực.',
    },
    {
      step: 5,
      phase: 'Kết tinh',
      title: 'Hoa tử huyền — “Muối của rừng”',
      image: './assets/images/detail-hoa-tu-huyen.jpg',
      detailText:
        'Trần truồng rẽ lối bụi gai tránh người giữa làn mưa xuân dịu hạt, ông Diểu bất ngờ gặp bạt ngàn hoa tử huyền trắng muốt ba mươi năm mới nở một lần — điềm báo đất nước thanh bình, mùa màng phong túc.',
      voiceScript:
        'Chặng năm, kết tinh: Trần truồng và cô đơn rẽ lối bụi gai giữa mưa xuân, ông Diểu bất ngờ bắt gặp bạt ngàn hoa tử huyền trắng muốt ba mươi năm mới nở một lần — muối của rừng ban tặng cho lòng thiện lương.',
    },
  ],
};
