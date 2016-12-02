/*
 * Root file that handles instances of all the charts and loads the visualization
 */

// var firstStockPriceChart = new SingleStockPriceChart(0);
// var secondStockPriceChart = new SingleStockPriceChart(1);

// var stockPriceChart = new SingleStockPriceChart();

(function(){
    var instance = null;

    function init() {
        d3.csv('data/S&P500Index.csv', function (error, indexOfSnP500Data) {
            var indexOfSnP500Chart = new IndexOfSPChart();
            // indexOfSnP500Chart.update(indexOfSnP500Data);

        var singleStockPricesChart = new SingleStockPricesChart(indexOfSnP500Chart);

        d3.text('data/tickers.txt',
            function(error, content)
            {
                var tickers = content.split('\n').map(function (d) { return d.trim(); });
                var defaultOptionName = ['aapl', 'goog'];

                var i;
                for (i in defaultOptionName) {
                    d3.select('#plot-selector-'+i).select('#dataset-'+i)
                        .selectAll('option').data(tickers)
                        .enter().append('option')
                        .attr('value', function(d) { return d; })
                        .text(function(d) { return d; })
                        .property("selected",
                            function(d) { return defaultOptionName[i] === d; });
                }

                d3.select('#dataset-0').on('change', function() {singleStockPricesChart.chooseData();});
                d3.select('#dataset-1').on('change', function() {singleStockPricesChart.chooseData();});
                d3.select('#types').on('change', function() {singleStockPricesChart.chooseData();});
                d3.select('#statementsSelect').on('change', function() {singleStockPricesChart.chooseData();});

                singleStockPricesChart.chooseData();
            });
        });
    }

    /**
     *
     * @constructor
     */
    function Main(){
        if(instance  !== null){
            throw new Error("Cannot instantiate more than one Class");
        }
    }

    /**
     *
     * @returns Main singleton class
     */
    Main.getInstance = function(){
        var self = this;
        if(self.instance == null){
            self.instance = new Main();

            //called only once when the class is initialized
            init();
        }
        return instance;
    };

    Main.getInstance();
})();