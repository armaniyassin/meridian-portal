export type Tip = { v: string; cat: string; t: string; d: string; a?: string };
export const TIPS: Tip[] = [
 {v:'seesaw',cat:'Bonds',t:'Yields up, bond prices down',d:'Existing bonds pay a fixed coupon, so when market yields rise their prices fall.',a:'bond-prices'},
 {v:'double',cat:'Basics',t:'The rule of 72',d:'Divide 72 by your yearly return to estimate the years it takes to double. At 6%, about 12.',a:'rule-of-72'},
 {v:'diversify',cat:'Basics',t:'Spread the risk',d:'Assets that do not move together smooth the total. It reduces risk, it does not remove it.',a:'diversification'},
 {v:'pe',cat:'Equities',t:'P/E in one grid',d:'A P/E of 20 means the price equals 20 years of today\'s earnings. Compare within a sector.',a:'pe-ratio'},
 {v:'curve',cat:'Bonds',t:'Three shapes of a yield curve',d:'Upward is normal. Inverted, with short yields above long ones, has often come before recessions.',a:'yield-curve'},
 {v:'fx',cat:'FX',t:'Base over quote',d:'In EUR/USD the rate is how many dollars one euro costs. A rising rate means a stronger euro.',a:'fx-pairs'},
 {v:'riskreturn',cat:'Basics',t:'Risk and reward travel together',d:'Higher expected returns usually come with bigger swings. Expected does not mean guaranteed.'},
 {v:'spread',cat:'Equities',t:'Bid, ask and the spread',d:'You buy at the ask and sell at the bid. The gap between them is a real cost of trading.',a:'spread'},
 {v:'vix',cat:'Macro',t:'The VIX is about swings, not direction',d:'It reflects the move options traders expect over 30 days, up or down.',a:'vix'},
 {v:'dca',cat:'Basics',t:'Steady buying',d:'A fixed sum on a schedule buys more shares when prices are low and fewer when they are high.'},
 {v:'inflation',cat:'Macro',t:'Cash loses buying power',d:'At 3% inflation, 100 buys in ten years what about 74 buys today.'}
];
export type Article = { id: string; cat: string; read: number; v: string; t: string; lede: string; b: string[]; k: string };
export const ARTICLES: Article[] = [
 {id:'bond-prices',cat:'Bonds',read:3,v:'seesaw',t:'Why bond prices fall when yields rise',lede:'A bond\'s coupon is fixed. Its price is not, and the two move in opposite directions.',
  b:['Imagine a bond that pays 4 a year for every 100 you lend. When it was issued, 4% was what the market offered.','Now new bonds start paying 5%. Nobody will pay 100 for your 4% bond when 100 buys a 5% one, so its price has to drop until buying it gives a competitive return.','The reverse also holds. When market yields fall, older bonds with higher coupons become more valuable and their prices rise.','How far the price moves depends mostly on maturity. Long bonds react more than short ones, because you are locked into the old coupon for longer.'],
  k:'Rising yields lower the price of existing bonds. Longer maturity means a bigger move.'},
 {id:'yield-curve',cat:'Bonds',read:3,v:'curve',t:'How to read a yield curve',lede:'A yield curve plots what a government pays to borrow for different lengths of time.',
  b:['Normally you are paid more for lending for longer, so the curve slopes upward. A 10-year yield sits above a 2-year yield.','A flat curve means investors see little difference between short and long lending. An inverted curve means short-term yields are higher than long-term ones.','Inversions of the US 2-year and 10-year yields have often come before recessions, but the delay is long and variable. Treat it as a signal to watch, not a timer.','On Meridian, the US yields come from FRED, the data service of the Federal Reserve Bank of St. Louis.'],
  k:'Upward is normal, inverted is a warning sign, and none of it is a prediction.'},
 {id:'pe-ratio',cat:'Equities',read:3,v:'pe',t:'What a P/E ratio tells you',lede:'The price to earnings ratio compares a share\'s price with the profit behind it.',
  b:['Divide the share price by earnings per share. If a share costs 100 and the company earned 5 per share over the last year, the P/E is 20.','Another way to read it: at today\'s earnings, the price equals 20 years of profit. A higher P/E usually means investors expect faster growth, or they will pay more for stability.','A P/E means little alone. Compare it with companies in the same sector and with the company\'s own history. Negative earnings give no usable P/E.','Pair it with debt to equity and return on equity to see how the profit is made.'],
  k:'P/E is price divided by earnings. Compare within a sector, never in isolation.'},
 {id:'fx-pairs',cat:'FX',read:3,v:'fx',t:'How to read a currency pair',lede:'Every exchange rate is the price of one currency in another.',
  b:['In EUR/USD, the euro is the base currency and the dollar is the quote currency. A rate of 1.1000 means 1 euro costs 1.1000 dollars.','If the number rises, the base currency got stronger against the quote currency. If it falls, it got weaker.','Most pairs are quoted to four decimals, and the smallest standard move, a pip, is 0.0001. Pairs involving the Japanese yen use two decimals, so a pip is 0.01.','Meridian shows nine pairs built around the dollar, from EUR/USD to USD/JPY.'],
  k:'Base over quote. A rising rate means the base currency strengthened.'},
 {id:'diversification',cat:'Basics',read:3,v:'diversify',t:'Diversification in one picture',lede:'Spreading money across assets that do not move together smooths the ride.',
  b:['Each thin line in the picture is one investment that goes up and down. The thick line is a portfolio holding all of them equally. It swings far less than the individual lines.','That works because the investments do not peak and fall at the same time. The less they move together, the bigger the effect.','Diversification does not remove market risk. In a broad sell-off many assets fall together, so it reduces risk but does not end it.','The picture uses invented smooth waves to show the idea. It is not market data.'],
  k:'Different assets, different timing, smoother total. Not risk free.'},
 {id:'rule-of-72',cat:'Basics',read:2,v:'double',t:'The rule of 72',lede:'A quick way to estimate how long money takes to double.',
  b:['Divide 72 by the yearly return in percent. At 6% a year, money doubles in about 12 years. At 8% it takes about 9.','The rule is an approximation that works best for returns between about 6% and 10%. The exact doubling time at 6% is 11.9 years.','It works in reverse too. Dividing 72 by the years you want gives the rate you need. It also applies to costs: at 3% inflation, prices double in about 24 years.'],
  k:'72 divided by the rate gives the years to double.'},
 {id:'vix',cat:'Macro',read:3,v:'vix',t:'What the VIX actually measures',lede:'The VIX is often called the fear gauge. It measures expected movement, not direction.',
  b:['The VIX is calculated from S&P 500 option prices. It reflects the volatility investors expect over the next 30 days, annualised.','A higher VIX means the market is pricing larger swings in either direction. It tends to rise when stocks fall sharply, which is how it earned its nickname.','A low VIX means calm expectations, not safety. A high VIX is not a prediction that prices will fall.','Meridian shows the VIX from FRED, with its last updated date.'],
  k:'The VIX measures expected swings over 30 days, not whether prices go up or down.'},
 {id:'spread',cat:'Equities',read:2,v:'spread',t:'Bid, ask and the spread',lede:'Every traded asset has two prices at any moment.',
  b:['The bid is the highest price a buyer is currently offering. The ask is the lowest price a seller will accept. The gap between them is the spread.','If you buy right away you pay the ask, and if you sell right away you receive the bid. The spread is a real cost of trading.','Heavily traded assets usually have narrow spreads. Thinly traded ones have wide spreads, so costs can be much higher.'],
  k:'You buy at the ask and sell at the bid. The gap is a cost.'}
];
export const QUOTES: { q: string; w: string; n: string }[] = [
 {q:'Be fearful when others are greedy, and be greedy when others are fearful.',w:'Warren Buffett',n:'Investor, 2008'},
 {q:'The investor\'s chief problem, and even his worst enemy, is likely to be himself.',w:'Benjamin Graham',n:'The Intelligent Investor'},
 {q:'Know what you own, and know why you own it.',w:'Peter Lynch',n:'Attributed'},
 {q:'Price is what you pay. Value is what you get.',w:'Warren Buffett',n:'Letter to shareholders'},
 {q:'The stock market is a device for transferring money from the impatient to the patient.',w:'Warren Buffett',n:'Attributed'},
 {q:'Never invest in a business you cannot understand.',w:'Warren Buffett',n:'Attributed'},
 {q:'Risk comes from not knowing what you are doing.',w:'Warren Buffett',n:'Attributed'},
 {q:'The four most dangerous words in investing are: this time it is different.',w:'John Templeton',n:'Attributed'},
 {q:'In the short run the market is a voting machine, in the long run a weighing machine.',w:'Benjamin Graham',n:'Attributed'},
 {q:'Diversification is the only free lunch in investing.',w:'Harry Markowitz',n:'Attributed'},
 {q:'The big money is not in the buying and selling, but in the waiting.',w:'Charlie Munger',n:'Attributed'},
 {q:'It is not whether you are right or wrong, but how much you make when right and lose when wrong.',w:'George Soros',n:'Attributed'},
 {q:'Investing should be more like watching paint dry or watching grass grow.',w:'Paul Samuelson',n:'Attributed'}
];
export const artById = (id: string) => ARTICLES.find((a) => a.id === id);
export const CATS = ['All', 'Bonds', 'Equities', 'FX', 'Macro', 'Basics'];


