// function IndexOfSPChart(indexOfSnP500Data)
function IndexOfSPChart()
{
    var self = this;
    self.init();
}


IndexOfSPChart.prototype.init = function()
{
    var self = this;
    self.margin = {top: 10, right: 100, bottom: 30, left: 50};
    var divyearChart = d3.select("#index-of-SP500-chart").classed("fullView", true);

    //Gets access to the div element created for this chart from HTML
    self.svgBoundsL = divyearChart.node().getBoundingClientRect();
    self.svgWidthL = self.svgBoundsL.width - self.margin.left - self.margin.right;
    self.svgHeight = 280;

    self.svg = divyearChart.append('svg')
        // .attr('width', self.svgWidth +  self.margin.left + self.margin.right)
        .attr('width', self.svgWidthL +  self.margin.left) // changed for 'focus'
        .attr('height', self.svgHeight + self.margin.top + self.margin.bottom)

    self.svgContent = self.svg.append('g')
        .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

    self.xaxis = self.svgContent.append('g').attr('class', 'x-Axis');
    self.yaxis = self.svgContent.append('g').attr('class', 'y-Axis');

    self.price = self.svgContent.append('path')
        .attr('class', 'line')
};


IndexOfSPChart.prototype.update = function(indexOfSnP500Data)
{
    var self = this;
    self.indexOfSnP500Data = indexOfSnP500Data;

    var parseDate = d3.timeParse('%Y-%m-%d'),  // yyyy-mm-dd
        bisectDate = d3.bisector(function(d) { return d.Date; }).left,
        legendFormat = d3.timeFormat('%Y-%m-%d');

    self.indexOfSnP500Data.forEach(function(d) {
        d.Date = parseDate(d.Date);
        d.Close = +d.Close;
    });

    self.indexOfSnP500Data.sort(function(a, b) {
        return a.Date - b.Date;
    });

    // Set the ranges
    var x = d3.scaleTime()
        .range([0, self.svgWidthL])
        .domain(d3.extent(self.indexOfSnP500Data, function(d) { return d.Date; })),

        y = d3.scaleLinear()
        .range([self.svgHeight, 0])
        .domain([0, d3.max(self.indexOfSnP500Data.map(function(d) { return d.Close; }))]);

    var xAxis = d3.axisBottom(x).tickSizeOuter(0);
        yAxis = d3.axisLeft(y).tickSizeOuter(0);


    self.valueLine = d3.line()
        .x(function(d) { return x(d.Date); })
        .y(function(d) { return y(d.Close); });

    // self.zeroLine = d3.line()
    //     .x(function(d) { return x(d.Date); })
    //     .y(function() { return y(0); });

    d3.select('.focus').remove();
    d3.select('.SP_legend').remove();
    d3.select('.indexOfSP').remove();


    // var mainPart = self.svg.append('g')
    //     .attr("transform", "translate(" + self.margin.left + "," + self.margin.top + ")");

    // self.price
    //     .attr('d', self.zeroLine(self.indexOfSnP500Data))
    //     .style('fill', 'none')
    //     .style('stroke', 'steelblue');

    self.price
        .transition().duration(3000)
        .attr('d', self.valueLine(self.indexOfSnP500Data))
        .style('stroke', 'steelblue');

    // Add the X Axis
    // mainPart.append('g')
    //     .attr('class', 'x-Axis')
    self.xaxis
        .attr('transform', 'translate(0,' + self.svgHeight + ')')
        .transition().duration(3000)
        .call(xAxis);

    // Add the Y Axis
    // mainPart.append('g')
    //     .attr('class', 'y-Axis')
    self.yaxis
        .transition().duration(3000)
        .call(yAxis);

    var legend = self.svgContent.append('g')
        .attr('class', 'SP_legend')
        .attr('width', self.svgWidthL)
        .attr('height', 30)
        .attr('transform', 'translate(' + self.margin.left + ', 10)');

    legend.append('text')
        .text('S&P 500');

    var helper = self.svgContent.append('text')
        .classed('indexOfSP', true)
        .style('text-anchor', 'start')
        .attr('transform', 'translate(50, 25)');

    var focus = self.svgContent.append('g')
        .attr('id', 'focus-0')
        .attr('class', 'focus')
        .style('display', 'none');

    focus
        .classed('focus', true)
        .append('circle')
        .attr('r', '5');

    self.svg
        .on('mouseover', function() {
            focus.style('display', null);
            helper.style('display', null);
        })
        .on('mouseout', function() {
            focus.style('display', 'none');
            helper.style('display', 'none');
        })
        .on('mousemove', mouseMoveF);

    function mouseMoveF() {
        var x0 = x.invert(d3.mouse(this)[0] - self.margin.left),
            i = bisectDate(self.indexOfSnP500Data, x0, 1),
            d0 = self.indexOfSnP500Data[i - 1],
            d1 = self.indexOfSnP500Data[i],
            d = x0 - d0.Date > d1.Date - x0 ? d1 : d0;
        focus.attr('transform', 'translate(' + x(d.Date) + ',' + y(d.Close) + ')');

        helper.text(legendFormat(d.Date) + ' - Price: ' + d.Close);
    }
};
