// CONSTANTS
const MS_PER_SEC = 1000;
const SECS_PER_MIN = 60;
const MINS_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DAYS_PER_YEAR = 365;
const TAB_PROFIT = `profit`;
const TAB_REVENUE = `revenue`;
const TAB_EMPLOYEES = `employee_count`;
const TAB_TAXES = `taxes`;

// DOM CONSTANTS
const Tabs = {
  profit: document.querySelector(`#tab-profit`),
  revenue: document.querySelector(`#tab-revenue`),
  employee_count: document.querySelector(`#tab-employees`),
  taxes: document.querySelector(`#tab-taxes`)
};

// UTILS
const getLastYears = (timeInMS, numberOfYears) => {
  return [...Array(numberOfYears)].map((it, i) => {
    if (i === 0) return getYear(timeInMS);
    else if (i > 0) {
      const yearsInMS = computeOneYearInMS() * i;
      const t = timeInMS - yearsInMS;
      return getYear(t);
    }
  });
};

const computeOneYearInMS = () => MS_PER_SEC * SECS_PER_MIN * MINS_PER_HOUR * HOURS_PER_DAY * DAYS_PER_YEAR;

const getYear = timeInMS => new Date(timeInMS).getFullYear();

const startsWithDbQuote = str => str[0] === `"`;

const endsWithDbQuote = str => str[str.length - 1] === `"`;

const isWrappedInDbQuotes = str => startsWithDbQuote(str) && endsWithDbQuote(str);

const isNotUndefined = value => value !== undefined;

// DATA HANDLING
const dataHandler = (data, years) => tab => {
  return years
    .map(it => data.hasOwnProperty(tab) && data[tab][`${unwrapFromQuotes(it)}`])
    .filter(isNotUndefined);
};

const unwrapFromQuotes = str => {
  if (typeof str !== 'string') return str;
  const trimmedStr = str.trim();
  if (isWrappedInDbQuotes(trimmedStr)) return trimmedStr.slice(1, -1);
  return str;
};

// GRAPH
const margin = { top: 20, right: 40, bottom: 20, left: 50 };
const width = 860 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select(`#wrapper`)
  .append(`svg`)
  .attr(`width`, width + margin.left + margin.right)
  .attr(`height`, height + margin.top + margin.bottom)
  .append(`g`)
  .attr(`transform`, `translate(${margin.left}, ${margin.top})`);

// SCALES
const xScale = d3.scaleBand()
  .range([0, width])
  .padding(0.5);

const yScale = d3.scaleLinear()
  .range([height, 0]);

const getYDomainExtent = data => {
  if (d3.min(data, d => +d.value) >= 0) return [0, d3.max(data, d => +d.value)];
  else return d3.extent(data, d => +d.value);
};

// AXIS
svg.append(`g`)
  .attr(`id`, `x-axis`)
  .attr(`transform`, `translate(0, ${height})`);

svg.append(`g`)
  .attr(`id`, `y-axis`);

const xAxis = d3.axisBottom(xScale);

const yAxis = d3.axisLeft(yScale)
  .tickSize(-width);

const customXAxis = g => {
  g.call(xAxis)
    .select(`.domain`).remove();

  g.selectAll(`.tick line`).remove()
};

const customYAxis = g => {
  g.call(yAxis)
    .select(`.domain`).remove();

  g.selectAll(`.tick line`)
    .attr(`stroke`, `#d8d8d8`);

  g.selectAll(`.tick text`)
    .attr(`x`, -20)
    .attr(`dy`, 4)
};

const update = (getTabData, tab) => {
  const data = getTabData(tab);

  xScale.domain(years);

  yScale.domain(getYDomainExtent(data));

  let bar = svg.selectAll(`.bar`)
    .data(data, d => d.value);

  bar.exit().remove();

  const barEnter = bar.enter()
    .append(`g`)
    .attr(`class`, `bar`)
    .attr(`transform`, d => `translate(${xScale(+d.year)}, 0)`);

  barEnter.append(`rect`)
    .attr(`class`, `bar-rect`)
    .attr(`y`, d => d.value >= 0 ? yScale(d.value) : yScale(0))
    .attr(`height`, d => Math.abs(yScale(d.value) - yScale(0)));

  bar = barEnter.merge(bar);

  bar.select(`.bar-rect`)
    .attr(`height`, d => Math.abs(yScale(d.value) - yScale(0)));

  d3.select(`#x-axis`).call(customXAxis);

  d3.select(`#y-axis`).call(customYAxis);
};

// INITIAL CALL
const years = getLastYears(Date.now(), 10).reverse();
const getTabData = dataHandler(DUMMY_DATA, years);
update(getTabData, TAB_PROFIT);

// EVENTS
Tabs.profit.addEventListener(`click`, e => {
  update(getTabData, TAB_PROFIT);
});

Tabs.revenue.addEventListener(`click`, e => {
  update(getTabData, TAB_REVENUE);
});

Tabs.employee_count.addEventListener(`click`, e => {
  update(getTabData, TAB_EMPLOYEES);
});

Tabs.taxes.addEventListener(`click`, e => {
  update(getTabData, TAB_TAXES);
});
