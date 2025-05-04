// Load dataset from the CSV file
d3.csv("data/video_games_cleaned.csv").then(dataset => {
  
  // Process the dataset and convert sales columns to numbers
  dataset.forEach(d => {
    d.NA_Sales = +d.NA_Sales;
    d.EU_Sales = +d.EU_Sales;
    d.JP_Sales = +d.JP_Sales;
    d.Other_Sales = +d.Other_Sales;
    d.Global_Sales = +d.Global_Sales;
    d.Year_of_Release = +d.Year_of_Release;
  });

  // 1. Sales Trends by Decade (Bar & Line Chart)
  // Mengelompokkan data berdasarkan dekade
  const decadeData = d3.rollup(dataset, v => d3.sum(v, d => d.Global_Sales), d => Math.floor(d.Year_of_Release / 10) * 10);

  // Membuat array dari decadeData, mengurutkan berdasarkan urutan kronologis
  const decadeArray = Array.from(decadeData, ([key, value]) => ({
    decade: `${key}s`, 
    sales: value
  })).sort((a, b) => parseInt(a.decade) - parseInt(b.decade));

  // Menghapus dekade 2020-an jika tidak ada data penjualan yang relevan
  const filteredDecadeArray = decadeArray.filter(d => d.decade !== "2020s");

  const margin = { top: 20, right: 30, bottom: 40, left: 40 };
  const width = 800 - margin.left - margin.right;
  const height = 400 - margin.top - margin.bottom;

  const svgDecade = d3.select("#decadeChart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  const xDecade = d3.scaleBand()
    .domain(filteredDecadeArray.map(d => d.decade))
    .range([0, width])
    .padding(0.1);

  const yDecade = d3.scaleLinear()
    .domain([0, d3.max(filteredDecadeArray, d => d.sales)])
    .nice()
    .range([height, 0]);

  svgDecade.selectAll(".bar")
    .data(filteredDecadeArray)
    .enter().append("rect")
    .attr("class", "bar")
    .attr("x", d => xDecade(d.decade))
    .attr("y", d => yDecade(d.sales))
    .attr("width", xDecade.bandwidth())
    .attr("height", d => height - yDecade(d.sales));

  const line = d3.line()
    .x(d => xDecade(d.decade) + xDecade.bandwidth() / 2)
    .y(d => yDecade(d.sales));

  svgDecade.append("path")
    .data([filteredDecadeArray])
    .attr("class", "line")
    .attr("d", line);

  svgDecade.append("g")
    .attr("class", "x axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(xDecade).ticks(filteredDecadeArray.length).tickSize(0));

  svgDecade.append("g")
    .attr("class", "y axis")
    .call(d3.axisLeft(yDecade).ticks(5));


  // 2. Top 10 Games by Global Sales (Bar Chart & Table)
  const topGamesData = dataset.sort((a, b) => b.Global_Sales - a.Global_Sales).slice(0, 10);

  const svgTopGames = d3.select("#topGamesChart")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  const xTopGames = d3.scaleBand()
    .domain(topGamesData.map(d => d.Name))
    .range([0, width])
    .padding(0.1);

  const yTopGames = d3.scaleLinear()
    .domain([0, d3.max(topGamesData, d => d.Global_Sales)])
    .nice()
    .range([height, 0]);

    // Membuat bar chart
  svgTopGames.selectAll(".bar")
  .data(topGamesData)
  .enter().append("rect")
  .attr("class", "bar")
  .attr("x", d => xTopGames(d.Name))
  .attr("y", d => yTopGames(d.Global_Sales))
  .attr("width", xTopGames.bandwidth())
  .attr("height", d => height - yTopGames(d.Global_Sales));

  // Menambahkan label sumbu X
  svgTopGames.append("text")
  .attr("x", width / 2)
  .attr("y", height + margin.bottom)
  .attr("text-anchor", "middle")
  .style("font-size", "12px")
  .text("Games");

  // Menambahkan label sumbu Y
  svgTopGames.append("text")
  .attr("x", -height / 2)
  .attr("y", -margin.left + 15)
  .attr("transform", "rotate(-90)")
  .attr("text-anchor", "middle")
  .style("font-size", "12px")
  .text("Global Sales");

  // Menambahkan sumbu X
  svgTopGames.append("g")
  .attr("class", "x axis")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(xTopGames))
  .selectAll("text")
  .style("text-anchor", "middle")
  .style("font-size", "10px")  // Menyesuaikan ukuran font
  .each(function(d, i) {
    const label = d; // Ambil label untuk diproses
    const words = label.split(" "); // Pisahkan berdasarkan spasi
    
    const text = d3.select(this); // Pilih elemen teks
    text.text(""); // Hapus teks asli
    
    // Jika lebih dari dua kata, pisahkan dua kata terakhir
    if (words.length > 2) {
      // Gabungkan dua kata pertama menjadi satu baris
      text.append("tspan")
        .text(words.slice(0, 2).join(" "))
        .attr("x", 0)
        .attr("dy", "0.7em") // Baris pertama tidak diberi jarak vertikal
        .style("text-anchor", "middle");

      // Gabungkan dua kata terakhir di baris kedua dengan jarak vertikal yang lebih besar
      text.append("tspan")
        .text(words.slice(2).join(" "))
        .attr("x", 0)
        .attr("dy", "1.2em") // Menyesuaikan jarak vertikal untuk pemisahan kata yang lebih baik
        .style("text-anchor", "middle");
    } else {
      // Jika hanya satu atau dua kata, tampilkan seperti biasa
      text.text(label);
    }
  });

  // Menambahkan sumbu Y
  svgTopGames.append("g")
  .attr("class", "y axis")
  .call(d3.axisLeft(yTopGames).ticks(5));

  // Menambahkan nilai di atas bar
  svgTopGames.selectAll(".bar")
  .data(topGamesData)
  .enter().append("text")
  .attr("x", d => xTopGames(d.Name) + xTopGames.bandwidth() / 2)
  .attr("y", d => yTopGames(d.Global_Sales) - 5)
  .attr("text-anchor", "middle")
  .style("font-size", "12px")
  .text(d => d.Global_Sales.toFixed(2));  // Tampilkan nilai Global Sales dengan dua angka di belakang koma
  
}).catch(error => {
  console.error("Error loading the CSV data: ", error);
});

// Histogram for ESRB Ratings
document.addEventListener('DOMContentLoaded', function () {
    const margin = { top: 40, right: 180, bottom: 60, left: 60 };
    const width = Math.min(800, window.innerWidth - 40) - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    const svg = d3.select("#chart1")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select(".tooltip");

    d3.csv("data/video_games_cleaned.csv").then(data => {
        const ratingCount = d3.rollup(
            data,
            v => v.length,
            d => d.Rating
        );

        const ratings = Array.from(ratingCount, ([Rating, Count]) => ({ Rating, Count }))
            .filter(d => d.Rating) // Remove empty ratings
            .sort((a, b) => d3.ascending(a.Rating, b.Rating));

        const x = d3.scaleBand()
            .domain(ratings.map(d => d.Rating))
            .range([0, width])
            .padding(0.2);

        const y = d3.scaleLinear()
            .domain([0, d3.max(ratings, d => d.Count)])
            .nice()
            .range([height, 0]);

        const colorPalette = ["#FCC6FF", "#FFE6C9", "#FFC785", "#FFA09B", "#C4D9FF", "#727D73", "#AAB99A", "#8D77AB"];
        const color = d3.scaleOrdinal()
            .domain(ratings.map(d => d.Rating))
            .range(colorPalette);

        const ratingDescriptions = {
            "EC": "Early Childhood",
            "E": "Everyone",
            "E10+": "Everyone 10+",
            "T": "Teen",
            "M": "Mature 17+",
            "AO": "Adults Only",
            "RP": "Rating Pending",
            "K-A": "Kids to Adults"
        };

        // Gridlines
        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y)
                .tickSize(-width)
                .tickFormat(""))
            .selectAll("line")
            .attr("stroke", "#ccc")
            .attr("stroke-dasharray", "3,3");

        // X Axis
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-25)")
            .style("text-anchor", "end");

        // Y Axis
        svg.append("g")
            .call(d3.axisLeft(y));

        // Axis Labels
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height + 50)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("ESRB Rating");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -height / 2)
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("Number of Games");

        // Bars
        svg.selectAll(".bar")
            .data(ratings)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("x", d => x(d.Rating))
            .attr("y", d => y(d.Count))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.Count))
            .attr("fill", d => color(d.Rating))
            .on("mouseover", function (event, d) {
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.Rating}</strong><br>${d.Count} games`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                d3.select(this).attr("opacity", 0.7);
            })
            .on("mouseout", function () {
                tooltip.style("opacity", 0);
                d3.select(this).attr("opacity", 1);
            });

        // Bar Value Labels
        svg.selectAll(".label")
            .data(ratings)
            .enter()
            .append("text")
            .attr("x", d => x(d.Rating) + x.bandwidth() / 2)
            .attr("y", d => y(d.Count) - 5)
            .attr("text-anchor", "middle")
            .attr("font-size", "12px")
            .text(d => d.Count);

        // Legend
        const legend = svg.append("g")
            .attr("transform", `translate(${width + 20}, 0)`);

        ratings.forEach((d, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 25})`);

            legendRow.append("rect")
                .attr("width", 18)
                .attr("height", 18)
                .attr("fill", color(d.Rating));

            legendRow.append("text")
                .attr("x", 24)
                .attr("y", 14)
                .text(`${d.Rating} – ${ratingDescriptions[d.Rating] || "Unknown"}`)
                .style("font-size", "13px");
        });
    }).catch(error => {
        console.error("Error loading or parsing CSV: ", error);
    });
});

document.addEventListener('DOMContentLoaded', function () {
    const margin = { top: 40, right: 40, bottom: 40, left: 150 };
    const width = Math.min(800, window.innerWidth - 40) - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg2 = d3.select("#chart2")
        .append("svg")
        .attr("width", width + margin.left + margin.right + 150)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select(".tooltip");

    d3.csv("data/video_games_cleaned.csv").then(data => {
        const publisherCount = d3.rollup(
            data,
            v => v.length,
            d => d.Publisher
        );

        const publishers = Array.from(publisherCount, ([Publisher, Count]) => ({ Publisher, Count }))
            .sort((a, b) => d3.descending(a.Count, b.Count))
            .slice(0, 5); // Top 5 only

        const y = d3.scaleBand()
            .domain(publishers.map(d => d.Publisher))
            .range([0, height])
            .padding(0.3);

        const x = d3.scaleLinear()
            .domain([0, d3.max(publishers, d => d.Count)])
            .nice()
            .range([0, width]);

        const colorPalette = ["#5F6F52", "#A9B388", "#FEFAE0", "#B99470", "#FFDF88"];
        const color = d3.scaleOrdinal()
            .domain(publishers.map(d => d.Publisher))
            .range(colorPalette);

        // X Axis
        svg2.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(5));

        // Y Axis
        svg2.append("g")
            .call(d3.axisLeft(y));

        // Gridlines
        svg2.append("g")
            .attr("class", "grid")
            .selectAll("line")
            .data(x.ticks(5))
            .enter()
            .append("line")
            .attr("x1", d => x(d))
            .attr("x2", d => x(d))
            .attr("y1", 0)
            .attr("y2", height)
            .attr("stroke", "#ccc")
            .attr("stroke-dasharray", "2,2");

        // Bars
        svg2.selectAll(".bar")
            .data(publishers)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.Publisher))
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.Count))
            .attr("fill", d => color(d.Publisher))
            .on("mouseover", function (event, d) {
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.Publisher}</strong><br>${d.Count} games`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
                d3.select(this).attr("opacity", 0.7);
            })
            .on("mouseout", function () {
                tooltip.style("opacity", 0);
                d3.select(this).attr("opacity", 1);
            });

        // Add labels to bars
        svg2.selectAll(".bar-label")
            .data(publishers)
            .enter()
            .append("text")
            .attr("class", "bar-label")
            .attr("x", d => x(d.Count) + 5)  // Position it at the end of the bar
            .attr("y", d => y(d.Publisher) + y.bandwidth() / 2)
            .attr("dy", ".35em")
            .attr("font-size", "12px")
            .text(d => d.Count);

        // Axis Labels
        svg2.append("text")
            .attr("x", width / 2)
            .attr("y", height + 35)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("Number of Games");

        svg2.append("text")
            .attr("x", -height / 2)
            .attr("y", -120)
            .attr("transform", "rotate(-90)")
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("Top 5 Publishers");

        // Legend
        const legend = svg2.append("g")
            .attr("transform", `translate(${width + 20}, 0)`);

        publishers.forEach((d, i) => {
            const legendRow = legend.append("g")
                .attr("transform", `translate(0, ${i * 25})`);

            legendRow.append("rect")
                .attr("width", 18)
                .attr("height", 18)
                .attr("fill", colorPalette[i]);

            legendRow.append("text")
                .attr("x", 24)
                .attr("y", 14)
                .text(d.Publisher)
                .style("font-size", "13px");
        });
    }).catch(error => {
        console.error("Error loading or parsing CSV: ", error);
    });
});

document.addEventListener("DOMContentLoaded", function () {

    // Data untuk grafik pertama (Platform Sales)
    const platformSales = {
        labels: ['Wii', 'PS4', 'X360', 'PS3', 'DS', 'PS2', 'PC', 'PS', 'GBA', 'N64'],
        datasets: [{
            label: 'Total Penjualan Global (Jutaan)',
            data: [82.53, 82.45, 81.59, 81.48, 31.37, 41.00, 35.52, 27.64, 32.77, 15.68],
            backgroundColor: 'rgb(0, 191, 255)',
            borderColor: 'rgb(0, 191, 255, 1)',
            borderWidth: 1
        }]
    };

    // Data untuk grafik kedua (Penjualan per Genre)
    const genreSales = {
        labels: ['Action', 'Shooter', 'Role-Playing', 'Sports', 'Strategy'],
        datasets: [{
            label: 'Total Penjualan Global per Genre (Jutaan)',
            data: [130.15, 100.23, 90.44, 80.35, 50.12],
            backgroundColor: 'rgb(255, 99, 132)',
            borderColor: 'rgb(255, 99, 132, 1)',
            borderWidth: 1
        }]
    };

    // Data untuk grafik ketiga (Tren Penjualan Video Game per Tahun)
    const yearlySales = {
        labels: [2000, 2001, 2002, 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010],
        datasets: [{
            label: 'Total Penjualan Global per Tahun (Jutaan)',
            data: [10.50, 12.30, 15.50, 17.80, 19.00, 22.10, 24.00, 26.30, 28.00, 30.20, 32.50],
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderWidth: 2,
            fill: true
        }]
    };

    // Fungsi untuk membuat grafik
    function createGraph(data, ctx, chartType, xTitle) {
        return new Chart(ctx, {
            type: chartType,
            data: data,
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(tooltipItem) {
                                return tooltipItem.raw + ' Juta';
                            }
                        }
                    },
                    datalabels: {
                        anchor: 'end',
                        align: 'top',
                        font: { weight: 'bold', size: 14, color: '#000' },
                        formatter: function(value) { return value.toFixed(2) + ' Juta'; }
                    }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Total Penjualan (Jutaan)' } },
                    x: { title: { display: true, text: xTitle } }
                }
            },
            plugins: [ChartDataLabels] // Menambahkan plugin datalabels
        });
    }

    // Menampilkan grafik pertama (Platform Sales)
    const ctxBar1 = document.getElementById('barChart1').getContext('2d');
    createGraph(platformSales, ctxBar1, 'bar', 'Platform');

    // Menampilkan grafik kedua (Genre Sales)
    const ctxBar2 = document.getElementById('barChart2').getContext('2d');
    createGraph(genreSales, ctxBar2, 'bar', 'Genre');

    // Menampilkan grafik ketiga (Yearly Sales)
    const ctxLine = document.getElementById('lineChart').getContext('2d');
    createGraph(yearlySales, ctxLine, 'line', 'Tahun');
});
