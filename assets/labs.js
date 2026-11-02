// Small, deterministic models. Inputs use fractions internally, not percent values.
export function posterior(prior, sensitivity, specificity) {
  const positives = prior * sensitivity + (1 - prior) * (1 - specificity);
  return positives ? prior * sensitivity / positives : 0;
}
export function equilibrium(intercept, demandSlope, supplySlope) {
  const price = intercept / (demandSlope + supplySlope);
  return { price, quantity: supplySlope * price };
}
export function compound(principal, rate, years) { return principal * (1 + rate) ** years; }
export function energy(mass, height) { return mass * 9.8 * height; }
export function binarySteps(size) { return size > 0 ? Math.floor(Math.log2(size)) + 1 : 0; }

const LABS = {
  bayes: {
    title: '基率为什么会改变判断？',
    introduction: '把“阳性”理解为一个分类器发出的信号。敏感度和特异度都固定为 90%，只改变事件本身的发生率。先猜一猜：信号出现后，事件真实发生的概率一定有 90% 吗？',
    controls: [{ id: 'prior', label: '事件基率（%）', min: 1, max: 90, value: 10, step: 1 }],
    compute: ([p]) => {
      const truePositives = 1000 * p / 100 * .9;
      const falsePositives = 1000 * (1 - p / 100) * .1;
      return `以 1000 个样本计算：真阳性约 ${truePositives.toFixed(0)} 个，假阳性约 ${falsePositives.toFixed(0)} 个。信号为阳性时，事件真实发生的概率为 ${(posterior(p / 100, .9, .9) * 100).toFixed(1)}%。`;
    },
    boundary: 'P(事件|阳性) = 敏感度×基率 / [敏感度×基率 + (1−特异度)×(1−基率)]。这是虚拟教学数据；实际检测、筛查与决策还需考虑样本、阈值和后果。'
  },
  market: {
    title: '需求增长，价格和数量怎样一起变？',
    introduction: '设需求量 Qd = a − 2P，供给量 Qs = 3P。拖动需求截距 a，观察供需相等时的均衡。单位是虚拟价格与数量单位。',
    controls: [{ id: 'demand', label: '需求截距 a', min: 20, max: 200, value: 100, step: 5 }],
    compute: ([a]) => { const e = equilibrium(a, 2, 3); return `均衡价格 P = a/5 = ${e.price.toFixed(1)}；均衡数量 Q = 3P = ${e.quantity.toFixed(1)}。需求曲线整体向外移动，沿同一条供给曲线形成新均衡。`; },
    boundary: '这是无税收、无价格管制、供给曲线固定的线性竞争市场模型；现实市场还受弹性、时间、市场势力和外部性影响。'
  },
  compound: {
    title: '复利增长究竟来自哪里？',
    introduction: '虚拟本金 10000 元，按固定年率复利增长，不追加投入。改变时间与年率，比较线性直觉与指数增长。',
    controls: [{ id: 'years', label: '时间（年）', min: 1, max: 40, value: 10, step: 1 }, { id: 'rate', label: '固定年率（%）', min: -10, max: 10, value: 3, step: .5 }],
    compute: ([years, rate]) => `终值 = 10000 × (1 + ${(rate / 100).toFixed(3)})^${years} = ${compound(10000, rate / 100, years).toFixed(2)} 元。若每年收益均不再投入，单利终值则为 ${(10000 * (1 + rate / 100 * years)).toFixed(2)} 元。`,
    boundary: '假设年率恒定，不计税费、通胀与波动，仅作数学示例。实际投资收益不恒定；此处数字不代表产品、预测或收益承诺。'
  },
  energy: {
    title: '提升一个物体，要付出多少能量？',
    introduction: '在近地面，质量 m 的物体升高 h，重力势能增加 ΔE = mgh。把重力加速度近似为 9.8 m/s²。',
    controls: [{ id: 'mass', label: '质量 m（kg）', min: 1, max: 100, value: 10, step: 1 }, { id: 'height', label: '高度 h（m）', min: 1, max: 20, value: 5, step: 1 }],
    compute: ([m, h]) => `势能增加 ${energy(m, h).toFixed(1)} J = ${(energy(m, h) / 3600000).toFixed(6)} kWh。若电机总效率为 70%，输入电能至少为 ${(energy(m, h) / .7).toFixed(1)} J。`,
    boundary: '近地面、忽略速度变化；机械系统还有摩擦、热损耗和启停过程。能量守恒不表示机械能在每个真实过程中都守恒。'
  },
  algorithm: {
    title: '数据变多，算法要多做多少步？',
    introduction: '在有序数组中寻找一个数：顺序查找最坏要检查每个元素；二分查找每次排除约一半区间。拖动数组大小，比较最坏检查次数。',
    controls: [{ id: 'size', label: '数组元素个数 n', min: 1, max: 1000, value: 100, step: 1 }],
    compute: ([n]) => `顺序查找最坏检查 ${n} 个元素。标准二分查找最坏约 ${binarySteps(n)} 轮。n = ${n} 时，floor(log₂ n) + 1 = ${binarySteps(n)}。`,
    boundary: '二分查找要求有序、可随机访问的数据，未计排序与维护成本；每轮的比较不等同于一次 CPU 指令。大 O 描述增长趋势，不直接等于实际耗时。'
  }
};
const DOMAIN_LABS = { 3: 'bayes', 31: 'market', 33: 'market', 36: 'compound', 51: 'energy', 58: 'energy', 59: 'bayes', 61: 'algorithm', 63: 'bayes', 85: 'compound' };
export function labMarkup(id) {
  const lab = LABS[DOMAIN_LABS[id]];
  if (!lab) return '';
  return `<aside class="interactive-lab panel"><p class="eyebrow">动手实验 / INTERACTIVE MODEL</p><h3>${lab.title}</h3><p>${lab.introduction}</p>${lab.controls.map(c => `<label class="lab-control" for="lab-${c.id}">${c.label}<output id="output-${c.id}" for="lab-${c.id}">${c.value}</output><input id="lab-${c.id}" type="range" min="${c.min}" max="${c.max}" value="${c.value}" step="${c.step}"></label>`).join('')}<p id="labResult" class="lab-result" aria-live="polite"></p><p class="small muted">${lab.boundary}</p></aside>`;
}
export function bindLab(id) {
  const lab = LABS[DOMAIN_LABS[id]];
  if (!lab || !document.querySelector('#labResult')) return;
  const inputs = lab.controls.map(c => document.getElementById(`lab-${c.id}`));
  const update = () => { inputs.forEach((input, i) => { document.getElementById(`output-${lab.controls[i].id}`).value = input.value; }); document.querySelector('#labResult').textContent = lab.compute(inputs.map(input => Number(input.value))); };
  inputs.forEach(input => input.addEventListener('input', update)); update();
}
