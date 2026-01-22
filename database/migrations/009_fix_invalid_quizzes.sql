-- Fix invalid quiz entries (Logic & Format Errors)

-- 1. Fix Logic Error: "Is there a fitting room?" (Pattern 3 -> Pattern 2)
UPDATE speak_mango_en.expressions
SET content = jsonb_set(content, '{ko, quiz}', $$
{
  "answer": "B",
  "question": "다음 중 'Is there a fitting room?'을 사용하기 가장 적절한 상황은?\n\nA. 🍝 새로운 파스타 레시피를 만들어본다.\nB. 👗 옷가게에서 마음에 드는 옷을 입어보고 싶을 때.\nC. 🎮 신형 게임기를 시험해본다."
}
$$::jsonb)
WHERE expression = 'Is there a fitting room?';

UPDATE speak_mango_en.expressions
SET content = jsonb_set(content, '{ja, quiz}', $$
{
  "answer": "B",
  "question": "お店で 'Is there a fitting room?' と尋ねるのに最も適した状況は？\n\nA. 🍝 新しいパスタのレシピを作ってみる。\nB. 👗 服屋で気に入った服を試着したい時。\nC. 🎮 新しいゲーム機を試してみる。"
}
$$::jsonb)
WHERE expression = 'Is there a fitting room?';

UPDATE speak_mango_en.expressions
SET content = jsonb_set(content, '{es, quiz}', $$
{
  "answer": "B",
  "question": "¿En qué situación usaría \"Is there a fitting room?\"?\n\nA. 🍝 Al probar una nueva receta de pasta.\nB. 👗 Cuando quiere probarse una ropa que le gusta en una tienda.\nC. 🎮 Al probar una nueva consola de videojuegos."
}
$$::jsonb)
WHERE expression = 'Is there a fitting room?';


-- 2. Fix Logic Error: "Do you have this in stock?" (Pattern 3 -> Pattern 2)
UPDATE speak_mango_en.expressions
SET content = jsonb_set(content, '{ko, quiz}', $$
{
  "answer": "B",
  "question": "다음 중 'Do you have this in stock?'이라고 물어볼 상황은?\n\nA. 🍔 햄버거 세트를 주문할 때.\nB. 👟 진열대에 없는 신발 사이즈가 있는지 궁금할 때.\nC. 💸 친구에게 돈을 빌려줄 때."
}
$$::jsonb)
WHERE expression = 'Do you have this in stock?';

UPDATE speak_mango_en.expressions
SET content = jsonb_set(content, '{ja, quiz}', $$
{
  "answer": "B",
  "question": "'Do you have this in stock?' と尋ねるのに最も適した状況は？\n\nA. 🍔 ハンバーガーセットを注文する時。\nB. 👟 店頭にない靴のサイズがあるか知りたい時。\nC. 💸 友達にお金を貸す時。"
}
$$::jsonb)
WHERE expression = 'Do you have this in stock?';

UPDATE speak_mango_en.expressions
SET content = jsonb_set(content, '{es, quiz}', $$
{
  "answer": "B",
  "question": "¿En qué situación usaría \"Do you have this in stock?\"?\n\nA. 🍔 Al pedir un combo de hamburguesa.\nB. 👟 Cuando quiere saber si tienen su talla de zapatos que no está en el estante.\nC. 💸 Al prestar dinero a un amigo."
}
$$::jsonb)
WHERE expression = 'Do you have this in stock?';


-- 3. Fix Format Error: "How's it going?" (Missing Options in JA/ES)
UPDATE speak_mango_en.expressions
SET content = jsonb_set(content, '{ja, quiz}', $$
{
  "answer": "C",
  "question": "「How's it going?」を最も適切に使える状況はどれですか？\n\nA. 🧑‍🏫 教授に初めて挨拶する時\nB. 🏥 病院で医師に会った時\nC. 🚶‍♀️ 道で偶然知り合い에 만났을 때"
}
$$::jsonb)
WHERE expression = 'How''s it going?';

UPDATE speak_mango_en.expressions
SET content = jsonb_set(content, '{es, quiz}', $$
{
  "answer": "C",
  "question": "¿En qué situación usaría \"How's it going?\"?\n\nA. 🧑‍🏫 Al saludar a un profesor por primera vez\nB. 🏥 Al encontrarse con un médico en el hospital\nC. 🚶‍♀️ Al encontrarse casualmente con un conocido en la calle"
}
$$::jsonb)
WHERE expression = 'How''s it going?';


-- 4. Fix Format Error: "down in the dumps" (Missing Options in JA/ES)
UPDATE speak_mango_en.expressions
SET content = jsonb_set(content, '{ja, quiz}', $$
{
  "answer": "B",
  "question": "次のうち、「I'm feeling down in the dumps.」と最も近い状況は？\n\nA. 🎉 友達と楽しくカラオケで遊んでいる。\nB. 😥 試験に落ちて、布団の中で天井を見つめている。\nC. 💪 新しい運動計画を立ててやる気に満ちている."
}
$$::jsonb)
WHERE expression = 'down in the dumps';

UPDATE speak_mango_en.expressions
SET content = jsonb_set(content, '{es, quiz}', $$
{
  "answer": "B",
  "question": "¿Cuál de las siguientes situaciones se parece más a \"I'm feeling down in the dumps\"?\n\nA. 🎉 Divirtiéndose en un karaoke con amigos.\nB. 😥 Mirando el techo desde la cama después de reprobar un examen.\nC. 💪 Motivado planeando una nueva rutina de ejercicios."
}
$$::jsonb)
WHERE expression = 'down in the dumps';