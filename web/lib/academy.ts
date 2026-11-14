export type QuizQ = { q: string; o: string[]; a: number; e: string };
export type Lesson = { slug: string; title: string; min: number; intro: string; body: [string, string][]; take: string[]; quiz: QuizQ[] };
export type Level = { n: string; short: string; free: boolean; blurb: string; lessons: string[] };

/** Original lesson text, inspired by CFA-level topics. Not affiliated with or endorsed by CFA Institute. Educational only. */
export const LESSONS: Lesson[] = [
 {
  "slug": "time-value-of-money",
  "title": "Time value of money",
  "min": 8,
  "intro": "A euro today is worth more than a euro next year. Almost every idea in finance builds on that one fact.",
  "body": [
   [
    "Why money has a time value",
    "Money you hold today can earn interest or be invested. Money promised for later cannot do that in the meantime. That is why people ask for a return for waiting, and why a payment in the future is worth less to you now than the same payment today."
   ],
   [
    "Future value: compounding forward",
    "If you invest an amount (the present value, PV) at a yearly rate r for n years, it grows to PV × (1 + r)^n. Each year's interest is added to the base, so later years earn interest on earlier interest. That is compounding. For example, 1,000 at 4% for 3 years becomes 1,000 × 1.04 × 1.04 × 1.04 = 1,124.86."
   ],
   [
    "Present value: discounting back",
    "Discounting is compounding in reverse. The present value of an amount FV received in n years is FV ÷ (1 + r)^n. A promise of 1,100 in one year, discounted at 10%, is worth 1,000 today. The rate you use is called the discount rate, and it reflects the return you could earn elsewhere and the risk of the promise."
   ],
   [
    "The same rule, many uses",
    "Bond prices, company valuation and loan payments all come from discounting future cash flows. A higher discount rate lowers present values. A longer wait lowers them further. Keep that pair in mind for the bond lesson."
   ]
  ],
  "take": [
   "Future value = PV × (1 + r)^n. Present value = FV ÷ (1 + r)^n.",
   "Compounding means interest earns interest.",
   "A higher rate or a longer wait lowers present value."
  ],
  "quiz": [
   {
    "q": "You invest 100 today at 5% a year, compounded annually. What is it worth after 2 years?",
    "o": [
     "105.00",
     "110.25",
     "110.00"
    ],
    "a": 1,
    "e": "Each year multiplies by 1.05, so 100 × 1.05 × 1.05 = 110.25. The extra 0.25 is interest earned on the first year's interest."
   },
   {
    "q": "What is the present value of 1,100 received in one year, discounted at 10%?",
    "o": [
     "1,000",
     "1,090",
     "990"
    ],
    "a": 0,
    "e": "Present value is 1,100 ÷ 1.10 = 1,000. Discounting divides by (1 + r) for each year of waiting."
   },
   {
    "q": "What happens to the present value of a future payment when the discount rate rises?",
    "o": [
     "It rises",
     "It falls",
     "It stays the same"
    ],
    "a": 1,
    "e": "A higher discount rate means each future euro is worth less today, so the present value falls."
   }
  ]
 },
 {
  "slug": "returns-and-risk",
  "title": "Returns and risk",
  "min": 9,
  "intro": "Return is what you earned. Risk is how bumpy the road was. Judging one without the other misleads.",
  "body": [
   [
    "Holding period return",
    "The holding period return is the total gain over the time you held an asset, as a share of what you paid. Add any income, such as dividends or coupons, to the price change. If you buy at 50, sell at 55 and receive 1 in dividends, the return is (55 − 50 + 1) ÷ 50 = 12%."
   ],
   [
    "Why averages can mislead",
    "Gains and losses compound. A fall of 10% followed by a rise of 10% does not bring you back to even: 100 becomes 90, then 99. The more a return swings, the more the compound result falls behind the simple average."
   ],
   [
    "Risk as variation",
    "A common measure of risk is volatility, the standard deviation of returns. It tells you how far returns typically move away from their average. A higher number means a wider range of outcomes, in both directions. It does not tell you which way the next move goes."
   ],
   [
    "Risk and expected return",
    "Investors generally need a higher expected return to accept more risk. Expected is not guaranteed, and a riskier asset can and does lose money. Comparing returns for similar levels of risk is a fairer test than comparing returns alone."
   ]
  ],
  "take": [
   "Holding period return = (price change + income) ÷ starting price.",
   "Losses need larger gains to recover: down 10% then up 10% leaves you below even.",
   "Volatility measures how much returns vary, not their direction."
  ],
  "quiz": [
   {
    "q": "You buy a share at 40, sell at 44 and receive a dividend of 2. What is the holding period return?",
    "o": [
     "10%",
     "15%",
     "5%"
    ],
    "a": 1,
    "e": "The gain is 4 from price plus 2 from the dividend, so 6 ÷ 40 = 15%."
   },
   {
    "q": "An investment falls 10% in year one and rises 10% in year two. Compared with where you started, you are:",
    "o": [
     "Exactly even",
     "Slightly below",
     "Slightly above"
    ],
    "a": 1,
    "e": "100 falls to 90, then 90 × 1.10 = 99. A loss needs a larger percentage gain to recover."
   },
   {
    "q": "What does a higher standard deviation of returns tell you?",
    "o": [
     "Returns will be positive",
     "Returns vary more widely",
     "Returns will be negative"
    ],
    "a": 1,
    "e": "Standard deviation measures the spread of returns around their average. It says nothing about direction."
   }
  ]
 },
 {
  "slug": "bond-pricing-basics",
  "title": "Bond pricing basics",
  "min": 9,
  "intro": "A bond is a loan that pays you back with interest. Its price is the present value of the cash it promises.",
  "body": [
   [
    "The parts of a bond",
    "A bond has a face value (also called par), usually 100, which is repaid at maturity. It pays a fixed coupon, a yearly amount quoted as a percentage of face value. A 5% coupon on a face value of 100 pays 5 a year."
   ],
   [
    "Price is a present value",
    "The price of a bond is today's value of every payment it will make, discounted at the market yield. Take a 2-year bond with a 5% coupon. At a market yield of 5% it is worth 100, because the coupon equals the yield."
   ],
   [
    "Yields up, price down",
    "If the market yield rises to 6%, the same bond is worth 5 ÷ 1.06 + 105 ÷ 1.06² = 98.17. If the yield falls to 4%, it is worth 5 ÷ 1.04 + 105 ÷ 1.04² = 101.89. The coupon is fixed, so only the price can adjust. Bond prices and yields move in opposite directions."
   ],
   [
    "Maturity matters",
    "The longer the maturity, the more future payments are discounted, and the more the price reacts to a change in yield. A 30-year bond swings more than a 2-year bond for the same yield move. That sensitivity is called duration."
   ]
  ],
  "take": [
   "Price = present value of coupons and face value, discounted at the market yield.",
   "When market yields rise, existing bond prices fall, and the other way round.",
   "Longer maturity means larger price swings."
  ],
  "quiz": [
   {
    "q": "A bond pays a fixed coupon. If market yields rise, what generally happens to its price?",
    "o": [
     "It rises",
     "It falls",
     "It stays the same"
    ],
    "a": 1,
    "e": "New bonds pay more, so the older fixed coupon is less attractive and its price falls until its yield matches the market."
   },
   {
    "q": "A bond with a 5% coupon trades at 100 when the market yield is 5%. If the market yield falls to 4%, the price will be:",
    "o": [
     "Below 100",
     "Above 100",
     "Exactly 100"
    ],
    "a": 1,
    "e": "The bond now pays more than new bonds, so investors pay a premium. In the example it is worth about 101.89 for a 2-year bond."
   },
   {
    "q": "Which bond reacts more to the same change in yield?",
    "o": [
     "A 2-year bond",
     "A 30-year bond",
     "Both the same"
    ],
    "a": 1,
    "e": "The longer the maturity, the longer you are locked into the old coupon, and the larger the price change. This is duration."
   }
  ]
 },
 {
  "slug": "reading-a-yield-curve",
  "title": "Reading a yield curve",
  "min": 8,
  "intro": "The yield curve shows what a government pays to borrow for different lengths of time. Its shape is a signal worth watching.",
  "body": [
   [
    "What the curve plots",
    "A yield curve plots yields on the vertical axis against maturity on the horizontal axis, usually for government bonds. Short maturities, such as 2 years, sit on the left and long maturities, such as 10 or 30 years, on the right."
   ],
   [
    "Three shapes",
    "In a normal curve, longer maturities pay more, so the line slopes up. A flat curve means short and long yields are close. An inverted curve means short yields are higher than long yields."
   ],
   [
    "The 2s10s spread",
    "A common gauge is the 10-year yield minus the 2-year yield. With example numbers of 4.20% and 3.90%, the spread is +0.30 percentage points, a normal curve. If the 2-year were 4.40%, the spread would be −0.20 and the curve inverted."
   ],
   [
    "How to use it",
    "Inversions in the US curve have often come before recessions, but the delay is long and variable and the signal has been wrong at times. Treat the curve as one piece of context. It is not a timer and not a forecast. On Meridian, US yields come from FRED with their observation date."
   ]
  ],
  "take": [
   "Normal curve slopes up, flat is level, inverted slopes down.",
   "The 2s10s spread is the 10-year yield minus the 2-year yield.",
   "An inverted curve is a warning signal to watch, not a prediction."
  ],
  "quiz": [
   {
    "q": "The 10-year yield is 4.20% and the 2-year yield is 3.90%. What is the 2s10s spread?",
    "o": [
     "+0.30 percentage points",
     "−0.30 percentage points",
     "+8.10 percentage points"
    ],
    "a": 0,
    "e": "10-year minus 2-year is 4.20 − 3.90 = +0.30 percentage points, which is a normal, upward sloping curve."
   },
   {
    "q": "Which description fits an inverted yield curve?",
    "o": [
     "Long yields above short yields",
     "Short yields above long yields",
     "All yields equal"
    ],
    "a": 1,
    "e": "Inverted means the short end yields more than the long end, so the curve slopes down."
   },
   {
    "q": "How should an inverted curve be used?",
    "o": [
     "As an exact recession timer",
     "As context, not a forecast",
     "As a reason to buy bonds"
    ],
    "a": 1,
    "e": "Inversions have often preceded recessions, but timing varies and the signal is not reliable enough to be a forecast."
   }
  ]
 }
];

export const LEVELS: Level[] = [
  { n: "Level 1 · Foundations", short: "Foundations", free: true, blurb: "The core ideas behind every market: time value, risk and return, bonds and the yield curve.", lessons: LESSONS.map((l) => l.slug) },
  { n: "Level 2 · Valuation", short: "Valuation", free: false, blurb: "How analysts put a value on companies and compare them.", lessons: ["Equity valuation models", "Discounted cash flow", "Ratio analysis"] },
  { n: "Level 3 · Portfolio management", short: "Portfolios", free: false, blurb: "Putting assets together: allocation, risk budgeting and construction.", lessons: ["Asset allocation", "Risk budgeting", "Portfolio construction"] },
];
export const lessonBySlug = (s: string) => LESSONS.find((l) => l.slug === s);
