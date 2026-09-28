/* topics.js — สารบัญเดียวของทั้งเว็บ: หมวด (Part) และบท (topic)
 * ฟิลด์ของบท:
 *   dp8    id บทใน Week 8 (AP.dp8)        lab   เลขข้อของ DP Lab (AP.lab)
 *   gr     id แล็บของ Greedy Tutor        gp    เลขข้อของโจทย์ Greedy (AP.GP)
 *   tags   หมวดของควิซ Greedy Tutor        games id เกมที่เกี่ยวข้อง
 *   tabs   แท็บที่มี (ค่าเริ่มต้น learn · anim · practice · quiz)   */
(function () {
  'use strict';
  const PARTS = [
    { id: 0, key: 'st', color: 'var(--ap-cand)', k: 'PART 0 · WEEK 7', title: 'Space & Time Trade-offs', sub: 'Counting sort, Horspool, Boyer-Moore, Hashing, B-trees: ยอมใช้พื้นที่เพื่อแลกความเร็ว' },
    { id: 1, key: 'dp', color: 'var(--ap-dp)', k: 'PART 1 · WEEK 8', title: 'Dynamic Programming', sub: 'ตารางเก็บคำตอบของปัญหาย่อย: เหรียญ, Knapsack, Optimal BST, Warshall/Floyd' },
    { id: 2, key: 'gr', color: 'var(--ap-gr)', k: 'PART 2 · WEEK 9', title: 'Greedy Technique', sub: 'เลือกที่ดีที่สุดตอนนี้: MST, Dijkstra, Huffman และโจทย์ 12 ข้อ' },
    { id: 3, key: 'tm', color: 'var(--ap-tm)', k: 'PART 3', title: 'ทฤษฎีการคำนวณ', sub: 'DTM vs NTM และคำถามระดับโลก P vs NP' },
    { id: 4, key: 'rv', color: 'var(--ap-rv)', k: 'PART 4', title: 'ฝึกและทบทวน', sub: 'สอบจำลอง เกม Cheat sheet และความคืบหน้า' },
  ];

  const T = (o) => Object.assign({ tabs: ['learn', 'anim', 'practice', 'quiz'], lab: [], gp: [], tags: [], games: [] }, o);
  const TOPICS = [
    T({ id: 'sti', part: 0, no: '7.0', title: 'ภาพรวม Space & Time Trade-offs', short: 'ภาพรวม', tabs: ['learn', 'quiz'], extra: 'sti' }),
    T({ id: 'cmp', part: 0, no: '7.1', title: 'Sorting by Comparison Counting', short: 'Comparison Counting', tabs: ['learn', 'anim', 'quiz'], extra: 'cmp', games: ['match'] }),
    T({ id: 'dist', part: 0, no: '7.2', title: 'Distribution Counting', short: 'Distribution Counting', tabs: ['learn', 'anim', 'quiz'], extra: 'dist', games: ['match'] }),
    T({ id: 'hor', part: 0, no: '7.3', title: "Horspool's Algorithm", short: 'Horspool', tabs: ['learn', 'anim', 'quiz'], extra: 'hor', games: ['match'] }),
    T({ id: 'bm', part: 0, no: '7.4', title: 'Boyer-Moore Algorithm', short: 'Boyer-Moore', tabs: ['learn', 'anim', 'quiz'], extra: 'bm', games: ['match'] }),
    T({ id: 'hash', part: 0, no: '7.5', title: 'Hashing', short: 'Hashing', tabs: ['learn', 'anim', 'quiz'], extra: 'hash', games: ['match'] }),
    T({ id: 'bt', part: 0, no: '7.6', title: 'B-Trees', short: 'B-Trees', tabs: ['learn', 'anim', 'quiz'], extra: 'bt', games: ['match'] }),

    T({ id: 'fib', part: 1, no: '1.0', title: 'แนวคิด DP ผ่าน Fibonacci', short: 'Fibonacci', dp8: 'fib', lab: [5], games: ['dpfill'] }),
    T({ id: 'coinrow', part: 1, no: '1.1', title: 'Coin-row problem', short: 'Coin-row', dp8: 'coinrow', lab: [1], games: ['dpfill'] }),
    T({ id: 'change', part: 1, no: '1.2', title: 'Change-making problem', short: 'Change-making', dp8: 'change', lab: [2], games: ['dpfill', 'greedy'] }),
    T({ id: 'collect', part: 1, no: '1.3', title: 'Coin-collection problem', short: 'Coin-collection', dp8: 'collect', lab: [3], games: ['dpfill'] }),
    T({ id: 'olympic', part: 1, no: '1.4', title: 'โจทย์เสริม: ผลรวมของ 6, 9, 20', short: 'โจทย์ 6, 9, 20', dp8: 'olympic', lab: [4], games: ['dpfill'] }),
    T({ id: 'knap', part: 1, no: '1.5', title: 'Knapsack + Memory Functions', short: 'Knapsack', dp8: 'knap', lab: [6, 7], games: ['dpfill', 'greedy'] }),
    T({ id: 'knapx', part: 1, no: '1.6', title: 'Knapsack ขยาย: Unbounded · Subset Sum · Partition', short: 'Knapsack ขยาย', lab: [8, 9, 10], extra: 'knapx' }),
    T({ id: 'obst', part: 1, no: '1.7', title: 'Optimal Binary Search Trees', short: 'Optimal BST', dp8: 'obst', lab: [11, 12, 13], games: ['dpfill'] }),
    T({ id: 'warshall', part: 1, no: '1.8', title: "Warshall's Algorithm", short: 'Warshall', dp8: 'warshall', lab: [16], games: ['dpfill'] }),
    T({ id: 'floyd', part: 1, no: '1.9', title: "Floyd's Algorithm", short: 'Floyd', dp8: 'floyd', lab: [17, 18, 19], games: ['dpfill'] }),
    T({ id: 'lcsmcm', part: 1, no: '1.10', title: 'เสริม: Matrix Chain และ LCS', short: 'Matrix Chain · LCS', lab: [14, 15], extra: 'lcsmcm' }),

    T({ id: 'gprin', part: 2, no: '2.0', title: 'หลักการของ Greedy', short: 'หลักการ Greedy', gp: [5], tags: ['Greedy'], games: ['greedy'], extra: 'gprin' }),
    T({ id: 'gcoin', part: 2, no: '2.1', title: 'ทอนเหรียญ: Greedy vs DP', short: 'ทอนเหรียญ', gr: 'coin', gp: [1], tags: ['เหรียญ'], games: ['greedy'], extra: 'gcoin' }),
    T({ id: 'prim', part: 2, no: '2.2', title: 'Spanning tree, MST และ Prim', short: 'MST · Prim', gr: 'prim', tags: ['MST', 'Prim'], games: ['algo'], extra: 'prim' }),
    T({ id: 'kruskal', part: 2, no: '2.3', title: "Kruskal's Algorithm", short: 'Kruskal', gr: 'kruskal', tags: ['Kruskal'], games: ['algo'], extra: 'kruskal' }),
    T({ id: 'dijkstra', part: 2, no: '2.4', title: "Dijkstra's Algorithm", short: 'Dijkstra', gr: 'dijkstra', lab: [20], tags: ['Dijkstra', 'เปรียบเทียบ'], games: ['algo'], extra: 'dijkstra' }),
    T({ id: 'huffman', part: 2, no: '2.5', title: 'Huffman Coding', short: 'Huffman', gr: 'huffman', gp: [12], tags: ['Huffman'], games: ['algo', 'match'], extra: 'huffman' }),
    T({ id: 'gprob', part: 2, no: '2.6', title: 'คลังโจทย์ Greedy 12 ข้อ', short: 'โจทย์ Greedy 12 ข้อ', gp: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], games: ['greedy'], tabs: ['learn', 'practice', 'quiz'], extra: 'gprob' }),

    T({ id: 'dtm', part: 3, no: '3.1', title: 'DTM vs NTM', short: 'DTM vs NTM', tabs: ['learn', 'anim', 'quiz'], extra: 'dtm' }),
    T({ id: 'pnp', part: 3, no: '3.2', title: 'P, NP และ P vs NP (+ TSP)', short: 'P vs NP', tabs: ['learn', 'anim', 'quiz'], extra: 'pnp' }),
  ];

  const TAB_LABEL = { learn: 'เรียน', anim: 'อนิเมชัน', practice: 'แบบฝึก', quiz: 'ควิซ' };
  const TOOLS = [
    { id: 'exam', href: '#exam', icon: '⏱', title: 'สอบจำลอง', desc: 'สุ่มข้อสอบจากทุกบท จับเวลา เลือกบทและจำนวนข้อได้' },
    { id: 'realexam', href: '#realexam', icon: '📝', title: 'ข้อสอบจริง', desc: 'สอบเก็บคะแนนย่อยครั้งที่ 2 ทั้ง 25 ข้อ พร้อมเฉลยและเหตุผล' },
    { id: 'games', href: '#games', icon: '🎮', title: 'เกม 4 แบบ', desc: 'เติมตาราง DP · เล่นเป็นอัลกอริทึม · จับคู่ · Greedy ได้ optimal ไหม' },
    { id: 'cheat', href: '#cheat', icon: '📋', title: 'Cheat sheet', desc: 'สูตร ความซับซ้อน และตารางเปรียบเทียบ พิมพ์ได้' },
    { id: 'progress', href: '#progress', icon: '📈', title: 'ความคืบหน้า', desc: 'คะแนนควิซและเกมของทุกบท' },
  ];
  const GAMES = [
    { id: 'dpfill', icon: '🧮', title: 'เติมตาราง DP แข่งเวลา', desc: 'สุ่มโจทย์จาก Week 8 แล้วกรอกช่องที่หายไปในตาราง ตอบเร็วได้คะแนนเพิ่ม' },
    { id: 'algo', icon: '🕹️', title: 'เล่นเป็นอัลกอริทึม', desc: 'คลิกเส้นหรือโหนดถัดไปของ Prim / Kruskal / Dijkstra บนกราฟสุ่ม' },
    { id: 'match', icon: '🃏', title: 'จับคู่ Flashcard', desc: 'จับคู่ชื่ออัลกอริทึมกับสูตร ความซับซ้อน หรือการใช้งาน' },
    { id: 'greedy', icon: '🤔', title: 'Greedy ได้ optimal ไหม?', desc: 'ทายว่า Greedy ให้คำตอบดีที่สุดหรือไม่ แล้วดูเฉลยเทียบกับ DP' },
  ];

  const byId = (id) => TOPICS.find((t) => t.id === id);
  const labTopic = (n) => (TOPICS.find((t) => t.lab.includes(n)) || {}).id;
  // ลิงก์ไปยังข้อของ DP Lab (โมดูล lab เรียกใช้)
  AP.labHref = (n, tab) => `#t/${labTopic(n)}/practice/${n}/${tab || 'problem'}`;
  AP.PARTS = PARTS; AP.TOPICS = TOPICS; AP.TAB_LABEL = TAB_LABEL; AP.TOOLS = TOOLS; AP.GAMES = GAMES;
  AP.topic = byId; AP.labTopic = labTopic;
  AP.topicIndex = (id) => TOPICS.findIndex((t) => t.id === id);
})();
