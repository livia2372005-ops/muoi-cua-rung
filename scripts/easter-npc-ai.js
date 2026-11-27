window.MuoiCuaRung = window.MuoiCuaRung || {};

/**
 * NPC Dialogue & Groq AI Controller (model: qwen/qwen3.8-27b)
 * Rotates across 3 XOR-encoded keys with graceful literary fallbacks when offline.
 */
(function () {
  var MODEL_ID = 'qwen/qwen3.8-27b';
  var ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

  var MASK = [73, 198, 45, 131, 90, 214, 17, 163];
  var SLOTS = [
    [46, 181, 70, 220, 16, 172, 117, 213, 51, 159, 74, 213, 25, 147, 36, 233, 29, 163, 70, 186, 106, 224, 94, 204, 30, 129, 73, 250, 56, 229, 87, 250, 16, 149, 66, 245, 23, 181, 84, 241, 51, 150, 20, 230, 53, 191, 89, 192, 14, 143, 76, 219, 22, 176, 96, 218],
    [46, 181, 70, 220, 44, 176, 70, 249, 45, 190, 21, 210, 20, 156, 93, 144, 19, 131, 30, 177, 54, 224, 92, 226, 30, 129, 73, 250, 56, 229, 87, 250, 42, 244, 106, 237, 51, 154, 41, 192, 30, 147, 64, 228, 57, 183, 80, 246, 60, 161, 29, 231, 57, 231, 100, 204],
    [46, 181, 70, 220, 105, 154, 119, 146, 125, 244, 73, 208, 46, 132, 127, 249, 26, 144, 69, 243, 105, 229, 90, 247, 30, 129, 73, 250, 56, 229, 87, 250, 17, 144, 75, 231, 11, 161, 121, 201, 123, 177, 103, 208, 46, 159, 34, 243, 31, 150, 91, 205, 53, 225, 119, 202]
  ];

  var slotCursor = 0;

  function decodeKey(idx) {
    var arr = SLOTS[idx % SLOTS.length];
    var chars = [];
    for (var i = 0; i < arr.length; i++) {
      chars.push(String.fromCharCode(arr[i] ^ MASK[i % MASK.length]));
    }
    return chars.join('');
  }

  var NPCS = [
    {
      id: 'duoi',
      name: 'Cụ Cây Duối Già',
      role: 'Cổ thụ giữ áo bên vách đá',
      worldX: 980,
      healOnce: 15,
      greeting: 'Khà khà... Ông Diểu đấy ư? Súng hai nòng rơi xuống vực rồi sao nay lại lọ mọ nhảy nhót nhặt xu vàng thế kia?',
      quickPrompts: [
        'Sao trong rừng lại có xu vàng hả cụ?',
        'Quần áo ấm tôi vắt trên cành cụ đâu rồi?',
        'Phía trước có nguy hiểm gì không cụ?'
      ],
      systemPrompt:
        'Bạn là Cụ Cây Duối Già trăm năm tuổi trong truyện ngắn "Muối của rừng" (Nguyễn Huy Thiệp). ' +
        'Trên cành bạn từng giữ chiếc áo ấm và đôi giày cao cổ ông Diểu cởi ra trước khi trận núi lở cuốn đi. ' +
        'Giọng điệu: hóm hỉnh, từng trải, hơi cà khịa nhẹ nhàng thói tham vật chất của con người nhưng ấm áp. ' +
        'Nếu được hỏi về đồng xu vàng trong mini-game, hãy đùa rằng chắc các bạn học sinh Nhóm 3 rải ra thử lòng tham ông đấy. ' +
        'Trả lời bằng tiếng Việt tự nhiên, súc tích đúng 1-3 câu ngắn (dưới 65 từ), không dùng markdown.',
      fallbacks: [
        'Áo ấm với giày cao cổ của ông bị trận sạt núi cuốn trôi sạch rồi, nhẹ người thế này nhảy qua bụi gai càng dễ chứ sao!',
        'Xu vàng lấp lánh đấy, nhưng đừng mải nhặt mà quên mấy chú khỉ con đang kẹt dây leo phía trước nhé ông Diểu.',
        'Cẩn thận mấy tảng đá lăn ở dốc Hõm Chết! Bấm phím Shift lướt nhanh qua là êm ru thôi.'
      ]
    },
    {
      id: 'khime',
      name: 'Khỉ Mẹ Rừng Dâu Da',
      role: 'Người mẹ trên mỏm đá Nam Xung',
      worldX: 2260,
      healOnce: 0,
      greeting: 'Chít chít... Ông từng mắng tôi là "bà trưởng giả giả dối", vậy mà giờ ông lại băng cỏ Lào cứu đàn khỉ chúng tôi ư?',
      quickPrompts: [
        'Cho tôi xin lỗi về phát súng ban sáng nhé!',
        'Đàn khỉ con lạc ở đâu để tôi cứu giúp?',
        'Vực Hõm Chết phía trước vượt qua thế nào?'
      ],
      systemPrompt:
        'Bạn là Khỉ Mẹ trong truyện ngắn "Muối của rừng" của Nguyễn Huy Thiệp — người vợ thủy chung liều mình quay lại cứu khỉ đực bị thương và lặng lẽ lẽo đẽo theo ông Diểu xuống núi. ' +
        'Giọng điệu: giàu tình mẫu tử, thẳng thắn nhưng vị tha khi thấy ông Diểu biết hối lỗi và cứu các chú khỉ trong rừng. ' +
        'Trả lời bằng tiếng Việt trong sáng, giàu cảm xúc, đúng 1-3 câu ngắn (dưới 65 từ), không dùng markdown.',
      fallbacks: [
        'Thấy ông vơ nắm cỏ Lào cầm máu cho bầy trẻ, tôi biết trái tim con người dưới lớp áo săn kia vẫn còn ấm lắm.',
        'Phía trước là khe vực Hõm Chết đặc quánh sương mù, ông nhớ lấy đà nhảy đôi thật chuẩn kẻo hụt chân nhé!',
        'Muông thú trong rừng chẳng cần xu vàng đâu, chỉ cần con người buông cây súng xuống là rừng xanh bình yên rồi.'
      ]
    },
    {
      id: 'thiep',
      name: 'Nhà văn Nguyễn Huy Thiệp',
      role: 'Khách bộ hành bên tách trà 1986',
      worldX: 3680,
      healOnce: 15,
      greeting: 'Chào ông bạn già! Năm 1986 tôi viết "Muối của rừng" làm gì có đoạn ông nhảy ăn xu thế này... Nhóm 3 thêm vào đấy à?',
      quickPrompts: [
        'Sao bác lại đặt tên truyện là Muối của rừng?',
        'Bác thấy cảnh tôi đi nhặt xu cứu khỉ thế nào?',
        'Vì sao cuối truyện ông Diểu phải trần truồng?'
      ],
      systemPrompt:
        'Bạn nhập vai nhà văn Nguyễn Huy Thiệp (tác giả truyện ngắn "Muối của rừng", 1986) đang ngồi uống trà trên tảng đá giữa thế giới pixel Easter Egg do Nhóm 3 lớp 12 thiết kế. ' +
        'Giọng điệu: điềm đạm, sắc sảo, triết lý sâu sắc về thiên nhiên và phần Người lương thiện nhưng pha nét hóm hỉnh tự trào khi thấy nhân vật ông Diểu của mình đang nhảy nhót ăn xu trong mini-game. ' +
        'Trả lời bằng tiếng Việt tinh tế, đúng 1-3 câu ngắn (dưới 70 từ), không dùng markdown.',
      fallbacks: [
        'Tôi để ông trút hết súng ống, quần áo là để con người trở về bản thể trần trụi, khiêm nhường nhất trước đại ngàn đấy thôi.',
        'Chuyện ăn xu chắc là trò tinh nghịch của các cô cậu Nhóm 3, nhưng vừa chạy vừa cứu khỉ thì vẫn giữ đúng cái cốt thiện lương tôi gửi gắm!',
        'Hoa tử huyền ba mươi năm mới nở một lần — thứ muối mặn kết tinh từ lòng trắc ẩn để giữ con người khỏi mục ruỗng.'
      ]
    },
    {
      id: 'tuhuyen',
      name: 'Linh Hồn Hoa Tử Huyền',
      role: 'Điềm lành 30 năm kết muối',
      worldX: 5050,
      healOnce: 25,
      greeting: 'Mưa xuân dịu hạt đã về... Người đi rừng biết buông bỏ sát sinh và cúi mình cứu vật sẽ thấy lối mòn nở trắng hoa tử huyền.',
      quickPrompts: [
        'Hoa tử huyền mang ý nghĩa gì với con người?',
        'Cảm ơn người đã tiếp thêm sức sống giữa mưa xuân!',
        'Cổng Kết Muối ở phía trước còn bao xa?'
      ],
      systemPrompt:
        'Bạn là Linh Hồn Hoa Tử Huyền — biểu tượng "muối của rừng" thiêng liêng 30 năm mới nở một lần trong truyện ngắn "Muối của rừng" (Nguyễn Huy Thiệp). ' +
        'Giọng điệu: thanh khiết, dịu dàng như mưa xuân, khích lệ lòng nhân ái và sự tái sinh nhân tính của ông Diểu. ' +
        'Trả lời bằng tiếng Việt giàu chất thơ, ngắn gọn 1-3 câu (dưới 65 từ), không dùng markdown.',
      fallbacks: [
        'Khi vũ khí bạo lực chìm xuống đáy vực và mảnh vải cuối cùng dùng để cứu một sinh linh, đất trời khắc trao tặng điềm lành thanh bình.',
        'Chỉ còn một quãng ngắn nữa là tới Thung Lũng Kết Muối ở mốc 600 mét rồi, hãy bước tiếp trong làn mưa xuân dịu hạt nhé!',
        'Mỗi chú khỉ ông cứu trên đường chính là một nhành hoa trắng nở sáng trong tâm hồn con người.'
      ]
    }
  ];

  function stripThinkTags(text) {
    if (!text) return '';
    return text
      .replace(/<think>[\s\S]*?<\/think>/gi, '')
      .replace(/^\s*["“]|["”]\s*$/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function EasterNpcController() {
    this.histories = {};
    this.healedBy = {};
  }

  EasterNpcController.prototype.getNpcs = function () {
    return NPCS;
  };

  EasterNpcController.prototype.resetSession = function () {
    this.histories = {};
    this.healedBy = {};
  };

  EasterNpcController.prototype.claimGreetingHeal = function (npc) {
    if (!npc || !npc.healOnce || this.healedBy[npc.id]) return 0;
    this.healedBy[npc.id] = true;
    return npc.healOnce;
  };

  EasterNpcController.prototype.askNpc = function (npc, userText, gameState) {
    var self = this;
    var cleanInput = (userText || '').trim();
    if (!cleanInput) return Promise.resolve('');

    if (!this.histories[npc.id]) {
      this.histories[npc.id] = [];
    }
    var hist = this.histories[npc.id];

    var statsContext =
      ' [Trạng thái người chơi hiện tại: Đang điều khiển ông Diểu ở cự ly ' +
      Math.round(gameState.distMeters || 0) +
      'm, máu ' +
      Math.round(gameState.hp || 100) +
      '/100, đã nhặt ' +
      (gameState.coins || 0) +
      ' đồng xu vàng, đã cứu ' +
      (gameState.monkeysSaved || 0) +
      ' chú khỉ].';

    var messages = [
      { role: 'system', content: npc.systemPrompt + statsContext },
      { role: 'assistant', content: npc.greeting }
    ].concat(hist.slice(-6));
    messages.push({ role: 'user', content: cleanInput });

    function trySlot(attempt) {
      if (attempt >= SLOTS.length) {
        var fbList = npc.fallbacks || [npc.greeting];
        var pick = fbList[(hist.length + cleanInput.length) % fbList.length];
        hist.push({ role: 'user', content: cleanInput });
        hist.push({ role: 'assistant', content: pick });
        return Promise.resolve(pick);
      }

      var idx = (slotCursor + attempt) % SLOTS.length;
      var apiKey = decodeKey(idx);

      return window
        .fetch(ENDPOINT, {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: MODEL_ID,
            messages: messages,
            max_completion_tokens: 190,
            temperature: 0.72
          })
        })
        .then(function (resp) {
          if (!resp.ok) throw new Error('HTTP ' + resp.status);
          return resp.json();
        })
        .then(function (data) {
          var raw =
            data &&
            data.choices &&
            data.choices[0] &&
            data.choices[0].message &&
            data.choices[0].message.content;
          var reply = stripThinkTags(raw);
          if (!reply) throw new Error('Empty reply');
          slotCursor = idx;
          hist.push({ role: 'user', content: cleanInput });
          hist.push({ role: 'assistant', content: reply });
          return reply;
        })
        .catch(function () {
          return trySlot(attempt + 1);
        });
    }

    return trySlot(0);
  };

  window.MuoiCuaRung.EasterNpcController = EasterNpcController;
})();
