export function createDishImage(name: string) {
  const display = name.length > 6 ? `${name.slice(0, 6)}…` : name;
  const svg = `
    <svg xmlns='http://www.w3.org/2000/svg' width='320' height='240'>
      <defs>
        <linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
          <stop offset='0%' stop-color='#dff3e4'/>
          <stop offset='100%' stop-color='#f7f1e8'/>
        </linearGradient>
      </defs>
      <rect width='320' height='240' rx='32' ry='32' fill='url(#g)' />
      <circle cx='70' cy='70' r='42' fill='#b7e4c7' opacity='0.6'/>
      <circle cx='250' cy='170' r='50' fill='#b7e4c7' opacity='0.5'/>
      <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle'
        font-family='ZCOOL XiaoWei, serif' font-size='22' fill='#4b3a2f'>${display}</text>
      <text x='50%' y='70%' dominant-baseline='middle' text-anchor='middle'
        font-family='ZCOOL XiaoWei, serif' font-size='14' fill='#6d4c41'>小厨房出品</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
