function SingleStockPricesChart(indexOfSnP500Chart)
{
    var self = this;

    self.indexOfSnP500Chart = indexOfSnP500Chart;
    self.init();
}

SingleStockPricesChart.prototype.init = function()
{
    var self = this;

    // I. Useful functions
    //// path generator generator :-)
    self.pathGenGen = function(xScl, yScl) {
        return d3.line()
            .x(function(d) { return xScl(d.Date); })
            .y(function(d) { return yScl(d.Close); });
    };

    self.parseDate = d3.timeParse('%Y%m%d');  // yyyymmdd

    // II. Layout related
    self.margin = {top: 15, right: 100, bottom: 20, left: 50};
    self.svgHeight = 420;

    //// 1. Left div
    var stockPricesDiv = d3.select('#two-stocks').classed('contentL', true);
    self.svgBoundsL = stockPricesDiv.node().getBoundingClientRect();
    self.svgWidthL = self.svgBoundsL.width - self.margin.left - self.margin.right;
    self.svgL = stockPricesDiv.select('#stock-prices');

    self.svgContentL = self.svgL
        .attr('width', self.svgWidthL + self.margin.left + self.margin.right)
        .attr('height', self.svgHeight + self.margin.top + self.margin.bottom)
        .append('g')
        .attr('transform', 'translate(' +
            self.margin.left + ', ' +
            self.margin.top + ')');

    self.svgContentL
        .selectAll('g')
        .data(['p0', 'p1', 'x0', 'y0', 'x1', 'y1'])
        .enter()
        .append('g')
        .attr('id', function(d) { return d; });

    //// 2. Right div
    var divStatements = d3.select('#statementsDiv').classed('contentR', true);
    self.svgBoundsR = divStatements.node().getBoundingClientRect();
    self.svgWidthR = self.svgBoundsR.width - self.margin.left - self.margin.right;
    self.svgR = divStatements.select('#statementsSvg');

    self.svgContentR = self.svgR
        .attr('width', self.svgWidthR + self.margin.left + self.margin.right)
        .attr('height', self.svgHeight + self.margin.top + self.margin.bottom)
        .append('g')
        .attr('id', 'statmentsContent')
        .attr('transform', 'translate(' +
            self.margin.left + ', ' +
            self.margin.top + ')');

    self.svgContentR
        .selectAll('g')
        .data(['bars', 'texts', 'yAxis', 'xAxis'])
        .enter()
        .append('g')
        .attr('id', function(d) { return d; });

    // III. Useful instance attributes
    self.price0 = self.svgContentL.select('#p0')
        .append('path')
        .style('stroke', 'blue')
        .attr('d', 'M 0.5 0 V 0.5 H 1333.22 V 0');


    self.price1 = self.svgContentL.select('#p1')
        .append('path')
        .style('stroke', 'red')
        .attr('d', 'M 0.5 0 V 0.5 H 1333.22 V 0');

    self.x0 = self.svgContentL.select('#x0');
    self.y0 = self.svgContentL.select('#y0');
    self.x1 = self.svgContentL.select('#x1');
    self.y1 = self.svgContentL.select('#y1');

    // IV. Initial View!
    self.updatePrices('aapl', 'goog', 'lines');
    self.updateFinantialStatements('aapl', 'goog', 'CASH_RATIO');
};


/**
 * Creates Prices Chart, and the stock prices of two companies will show up.
 *
 // * @param ticker0
 // * @param ticker1
 // * @param chartType: this can be "lines", "separate", "normalized"
 */
SingleStockPricesChart.prototype.updatePrices = function(ticker0, ticker1, chartType)
{
    var self = this;

    self.oldTicker0 = ticker0;
    self.oldTicker1 = ticker1;
    self.oldChartType = chartType;

    d3.text('./data/daily/table_'+ticker0+'.csv', function(error0, text0) {
        d3.text('./data/daily/table_'+ticker1+'.csv', function(error1, text1) {
            // Date	Open	High	Low	Close	Adj Close*	Volume
            var dailyStockPrice0 = d3.csvParseRows(text0, function (d) { return {'Date': d[0], 'Close': d[5]}; });
            var dailyStockPrice1 = d3.csvParseRows(text1, function (d) { return {'Date': d[0], 'Close': d[5]}; });

            dailyStockPrice0.forEach(function(d) {
                d.Date = self.parseDate(d.Date);
                d.Close = +d.Close;
            });

            dailyStockPrice1.forEach(function(d) {
                d.Date = self.parseDate(d.Date);
                d.Close = +d.Close;
            });

            var x0, y0, x1, y1;
            var xLowerBound, xUpperBound;
            var xLowerBoundPrime, xUpperBoundPrime;
            var filteredDailyStockPrice0, filteredDailyStockPrice1;
            var xAxis, yAxis;

            var xExt0 = d3.extent(dailyStockPrice0, function(d) { return d.Date; });
            var xExt1 = d3.extent(dailyStockPrice1, function(d) { return d.Date; });

            if (chartType === 'lines') {
                x0 = d3.scaleTime().range([0, self.svgWidthL]);
                y0 = d3.scaleLinear().range([self.svgHeight, 0]);

                // x axist
                // xExt0 = d3.extent(dailyStockPrice0, function(d) { return d.Date; });
                // xExt1 = d3.extent(dailyStockPrice1, function(d) { return d.Date; });
                xLowerBound = xExt0[0] > xExt1[0] ? xExt0[0] : xExt1[0];
                xUpperBound = xExt0[1] < xExt1[1] ? xExt0[1] : xExt1[1];
                x0.domain([xLowerBound, xUpperBound]);

                filteredDailyStockPrice0 = dailyStockPrice0.filter(function(d) { return d.Date >= xLowerBound && d.Date <= xUpperBound; });
                filteredDailyStockPrice1 = dailyStockPrice1.filter(function(d) { return d.Date >= xLowerBound && d.Date <= xUpperBound; });

                // y axist
                var yExt0 = d3.extent(filteredDailyStockPrice0, function(d) { return d.Close; });
                var yExt1 = d3.extent(filteredDailyStockPrice1, function(d) { return d.Close; });
                var yUpperBound = yExt0[1] < yExt1[1] ? yExt1[1] : yExt0[1];
                y0.domain([0, yUpperBound]);

                xAxis = d3.axisBottom(x0).tickSizeOuter(0).ticks(10);
                yAxis = d3.axisLeft(y0).tickSizeOuter(0).ticks(5);

                self.x0
                    .transition().duration(3000)
                    .attr('transform', 'translate(0,' + self.svgHeight + ')')
                    .call(xAxis);

                self.y0
                    .transition().duration(3000)
                    .call(yAxis);

                self.x1
                    .attr('transform', 'translate(0,' + self.svgHeight + ')')
                    .transition().duration(3000)
                    .call(xAxis);

                self.y1
                    .attr('text-anchor', 'end')
                    .transition().duration(3000)
                    .attr("transform", 'translate(0, 0)')
                    .call(yAxis);

                var valueLine = self.pathGenGen(x0, y0);
                self.price0.transition().duration(3000).attr('d', valueLine(filteredDailyStockPrice0));
                self.price1.transition().duration(3000).attr('d', valueLine(filteredDailyStockPrice1));
                d3.csv('data/S&P500Index.csv', function (error, indexOfSnP500Data) {
                    self.indexOfSnP500Chart.update(indexOfSnP500Data.filter(function(d) {
                        var parseDate = d3.timeParse('%Y-%m-%d');
                        var date = parseDate(d.Date);
                        return date >= xLowerBound && date <= xUpperBound;
                    }))
                });
            } else if ( chartType == 'separate') {
                function oneLine0(gid, data, x, y) {
                    // xExt0 = d3.extent(dailyStockPrice0, function(d) { return d.Date; });
                    // xExt1 = d3.extent(dailyStockPrice1, function(d) { return d.Date; });
                    xLowerBoundPrime = xExt0[0] < xExt1[0] ? xExt0[0] : xExt1[0];
                    xUpperBoundPrime = xExt0[1] > xExt1[1] ? xExt0[1] : xExt1[1];

                    var xAxis = d3.axisBottom(x).tickSizeOuter(0).ticks(10);
                    var yAxis = d3.axisLeft(y).tickSizeOuter(0).ticks(5);

                    var valueLine = self.pathGenGen(x, y);

                    if (gid == 'upper') {
                        self.x0
                            .transition().duration(3000)
                            .attr("transform", "translate(0," + (self.svgHeight/2 - 10) + ")")
                            .call(xAxis);

                        self.y0
                            .transition().duration(3000)
                            .call(yAxis);

                        self.price0.transition().duration(3000).attr('d', valueLine(data));
                    } else {
                        self.x1
                            .transition().duration(3000)
                            .attr("transform", "translate(0," + self.svgHeight + ")")
                            .call(xAxis);

                        self.y1
                            .attr('text-anchor', 'end')
                            .transition().duration(3000)
                            .attr("transform", 'translate(0, 0)')
                            .call(yAxis);

                        self.price1.transition().duration(3000).attr('d', valueLine(data));
                    }
                }

                x0 = d3.scaleTime()
                    .range([0, self.svgWidthL])
                    .domain(d3.extent(dailyStockPrice0, function(d) { return d.Date; }));

                y0 = d3.scaleLinear()
                    .range([self.svgHeight/2 - 10, 10])
                    .domain([0, d3.max(dailyStockPrice0, function(d) { return d.Close; })]);

                oneLine0('upper', dailyStockPrice0, x0, y0);

                x1 = d3.scaleTime()
                    .range([0, self.svgWidthL])
                    .domain(d3.extent(dailyStockPrice1, function(d) { return d.Date; }));

                y1 = d3.scaleLinear()
                    .range([self.svgHeight, self.svgHeight/2 + 10])
                    .domain([0, d3.max(dailyStockPrice1, function(d) { return d.Close; })]);

                oneLine0('lower', dailyStockPrice1, x1, y1);

                d3.csv('data/S&P500Index.csv', function (error, indexOfSnP500Data) {
                    self.indexOfSnP500Chart.update(indexOfSnP500Data.filter(function(d) {
                        var parseDate = d3.timeParse('%Y-%m-%d');
                        var date = parseDate(d.Date);
                        return date >= xLowerBoundPrime && date <= xUpperBoundPrime;
                    }))
                });
            } else if ( chartType == 'normalized') {
                function oneLine1(gid, data, x, y) {
                    xAxis = d3.axisBottom(x).tickSizeOuter(0).ticks(10);
                    var valueLine = self.pathGenGen(x, y);

                    if (gid == 'upper') {
                        self.x0
                            .transition().duration(3000)
                            .attr("transform", "translate(0," + self.svgHeight + ")")
                            .call(xAxis);

                        self.y0
                            .transition().duration(3000)
                            .call(d3.axisLeft(y).tickSizeOuter(0).ticks(5));

                        self.price0.transition().duration(3000).attr('d', valueLine(data));
                    } else {
                        self.x1
                            .transition().duration(3000)
                            .attr("transform", "translate(0," + self.svgHeight + ")")
                            .call(xAxis);

                        self.y1
                            .transition().duration(3000)
                            .attr("transform", 'translate(' + self.svgWidthL + ', 0)')
                            .attr('text-anchor', 'start')
                            .call(d3.axisRight(y).tickSizeOuter(0).ticks(5));

                        self.price1.transition().duration(3000).attr('d', valueLine(data));
                    }
                }

                var xCommon = d3.scaleTime().range([0, self.svgWidthL]);

                // x axist
                xExt0 = d3.extent(dailyStockPrice0, function(d) { return d.Date; });
                xExt1 = d3.extent(dailyStockPrice1, function(d) { return d.Date; });

                xLowerBound = xExt0[0] > xExt1[0] ? xExt0[0] : xExt1[0];
                xUpperBound = xExt0[1] < xExt1[1] ? xExt0[1] : xExt1[1];
                xCommon.domain([xLowerBound, xUpperBound]);
                filteredDailyStockPrice0 = dailyStockPrice0.filter(function(d) { return d.Date >= xLowerBound && d.Date <= xUpperBound; });
                filteredDailyStockPrice1 = dailyStockPrice1.filter(function(d) { return d.Date >= xLowerBound && d.Date <= xUpperBound; });

                y0 = d3.scaleLinear()
                    .range([self.svgHeight, 0])
                    .domain([0, d3.max(filteredDailyStockPrice0, function(d) { return d.Close; })]);

                oneLine1('upper', filteredDailyStockPrice0, xCommon, y0);

                y1 = d3.scaleLinear()
                    .range([self.svgHeight, 0])
                    .domain([0, d3.max(filteredDailyStockPrice1, function(d) { return d.Close; })]);

                oneLine1('lower', filteredDailyStockPrice1, xCommon, y1);

                d3.csv('data/S&P500Index.csv', function (error, indexOfSnP500Data) {
                    self.indexOfSnP500Chart.update(indexOfSnP500Data.filter(function(d) {
                        var parseDate = d3.timeParse('%Y-%m-%d');
                        var date = parseDate(d.Date);
                        return date >= xLowerBound && date <= xUpperBound;
                    }))
                });
            }
        });
    });
};


SingleStockPricesChart.prototype.updateFinantialStatements = function(ticker0, ticker1, statementType)
{
    var self = this;

    self.oldTicker0 = ticker0;
    self.oldTicker1 = ticker1;
    self.oldStatementType = statementType;

    d3.csv('./data/statements/'+ticker0.toUpperCase()+'.csv', function(error0, leftData) {
        d3.csv('./data/statements/'+ticker1.toUpperCase() +'.csv', function(error1, rightData) {
            data_combined = d3.merge([leftData, rightData]);
            statementsDiv = d3.select("#statementsDiv");
            statements_svg = statementsDiv.select("#statementsSvg");
            statements_svg_bars_group = statements_svg.select("#bars");

            // Choose the max and min of the y-axis labels to rescale the yaxis
            var maxValue = d3.max(data_combined, function (d) { return parseFloat(d[statementType]); });


            // Create two colorScales: Blue for the first company, and Red for the second company
            var colorScaleBlue = d3.scaleLinear()
                .domain([0, maxValue])
                .range(['#097ecc', '#043352']);

            var colorScaleRed = d3.scaleLinear()
                .domain([0, maxValue])
                .range(["#fcbba1", "#860308"]);

            // Define Transitions
            var t = d3.transition().duration(2000);

            var yScale = d3.scaleLinear()
                .domain([0, maxValue]).range([self.svgHeight, 0]);

            var xScale = d3.scaleBand()
                .domain([2011,2012,2013,2014,2015]).range([0, self.svgWidthR]);

            var xAxis = d3.axisBottom()
                .scale(xScale)
                .tickSizeOuter(0);

            // var yAxis = d3.axisRight()
            var yAxis = d3.axisLeft()
                .scale(yScale)
                .tickSizeOuter(0);

            // Now we plot them in the picture by calling x and y axes
            self.svgContentR.select("#xAxis")
                .attr("transform", "translate(0,"+self.svgHeight+")")
                .call(xAxis);

            self.svgContentR.select("#yAxis")
                .transition(t)
                .call(yAxis);


            statements_select = statementsDiv.select("#statementsSelect");

            // Add Names to the Select Button. Manually Constuct All the options.
            attrs_to_show = ["Cash Ratio",
                "Current Ratio",
                " Quick Ratio",
                "Growth Margin",
                "Sales Growth",
                "Operation Income/Current Debt",
                "Total Debt/EBITDA",
                "Total Debt/Asset",
                "Total Debt/Equity",
                "Receivable Days",
                "Inventory Management",
                "Effective Tax Rate"];

            // The total proportional of space we want the bar in the x-direction to occupy is q
            q = 0.75;
            bars_total_x_space = q * self.svgWidthR;
            blank_x_space = (1 - q) * self.svgWidthR;
            barWidth = q * bars_total_x_space / (data_combined.length);

            // Define two quantities for adjustments for bars in the svg //
            var tickPosInc = self.svgWidthR / leftData.length;
            var initPosShift = -(tickPosInc / 2);


            // Now we let all the bars in and give them data //
            var bars = statements_svg_bars_group.selectAll("rect").data(data_combined);
            bars = bars.enter()
                .append('rect')
                .attr('y', self.svgHeight)
                .merge(bars);

            // We need to implement transitions to all bars
            bars.exit().remove();


            // The above two lines is hard math, but notice that these two terms
            // are defined in terms of previous quantities. So no additional
            // adjustment needs to be done, even we were to make future changes

            // Set Attributes to Bars
            bars
                .attr('x', function (d, i) {
                    if (i%2 == 0) {
                        return tickPosInc*(i/2+1) - (barWidth - initPosShift);
                    } else {
                        return tickPosInc*(i+1)/2 + initPosShift + 1;
                    }
                })
                .attr('width', barWidth)
                .classed('noData', function(d) {
                    return d[statementType] === undefined || isNaN(d[statementType]) || d[statementType] < 0;
                });

            bars.transition(t)
                .attr('height', function (d) {
                    if      (d[statementType] === undefined) { return self.svgHeight / 3; }  // no <ticker>.csv
                    else if (isNaN(d[statementType]))        { return self.svgHeight / 3; }  // no this entry
                    else if (d[statementType] >= 0)          { return self.svgHeight - yScale(d[statementType]); }
                    else if (d[statementType] < 0)           { return Math.abs(d[statementType]) / maxValue * 50; }
                })
                .attr('y', function (d) {
                    if (d[statementType] === undefined) { return self.svgHeight * 2 / 3; }  // no this entry
                    else if (isNaN(d[statementType]))   { return self.svgHeight * 2 / 3; }  // no this entry of certain year
                    else if (d[statementType] >= 0)     { return yScale(d[statementType]); }
                    else if (d[statementType] < 0)      { return self.svgHeight; }
                })
                .style('fill', function (d, i) {
                    if      (isNaN(d[statementType])) { return 'grey'; }
                    else if (d[statementType] < 0)    { return 'yellow'; }
                    else if (i%2 == 0)                { return colorScaleBlue(d[statementType]); }
                    else                              { return colorScaleRed(d[statementType]); }
                });


            // Create all the above bars texts
            var barTextGrp = statements_svg.select('#texts')
                .attr('transform', 'translate(0, ' + -2 + ')');

            var above_bars_texts = barTextGrp.selectAll('text')
                .data(data_combined.map(function(d) {
                    return d[statementType] === undefined ? 'N/A' : d[statementType];
                }));

            // Now merge
            above_bars_texts = above_bars_texts.enter()
                .append('text')
                .style("text-anchor","start")
                .attr('y', self.svgHeight)
                .attr('x', function(d, i){
                    if (i%2 == 0) {
                        return  1/20 * barWidth + tickPosInc*(i/2+1)-(barWidth - initPosShift);
                    } else {
                        return 1/20 * barWidth + tickPosInc*(i+1)/2 + initPosShift + 1;
                    }
                })
                .merge(above_bars_texts);

            // Now exit and remove
            above_bars_texts.exit().remove();

            // Set texts's attributes
            var x_left_adjustment_ratio = 1/9;
            above_bars_texts
                .attr("class", "barText")
                .text(function(d) {
                    if (isNaN(d)) { return 'N/A'; }
                    else          { return parseFloat(d).toFixed(1); }
                })
                .transition(t)
                .attr("x", function(d,i){
                    if (i%2 == 0) {
                        return  x_left_adjustment_ratio* barWidth + tickPosInc*(i/2+1)-(barWidth- initPosShift)
                    } else {
                        return x_left_adjustment_ratio* barWidth + tickPosInc*(i+1)/2+initPosShift;
                    }
                })
                .attr('y', function (d) {
                    if      (isNaN(d)) { return self.svgHeight * 2/3; }
                    else if (d <= 0)   { return self.svgHeight; }
                    else               { return yScale(d); }
                })
                .style("fill", function(d,i){
                    if      (isNaN(d)) { return 'gray'; }
                    else if (d < 0)    { return 'purple'; }
                    else if (i%2 == 0) { return colorScaleBlue(d); }
                    else               { return colorScaleRed(d); }
                });
        });
    });
};



SingleStockPricesChart.prototype.chooseData = function()
{
    var self = this;
    var ticker0 = document.getElementById('dataset-'+0).value;
    var ticker1 = document.getElementById('dataset-'+1).value;
    var chartType = document.getElementById('types').value;
    var statementType = document.getElementById('statementsSelect').value;

    var condT = ticker0 != self.oldTicker0 || ticker1 != self.oldTicker1 || chartType != self.oldChartType;
    var condS = ticker0 != self.oldTicker0 || ticker1 != self.oldTicker1 || statementType != self.oldStatementType;

    if (condT) {
        self.updatePrices(ticker0, ticker1, chartType);
        self.updateFinantialStatements(ticker0, ticker1, statementType);
    } else if (!condT && condS) {
        self.updateFinantialStatements(ticker0, ticker1, statementType);
    } else {
        // Do nothing;
        // Keep this branch to protect the completeness of the logic!
        // This part might be used in the future or for debugging.
    }
};
