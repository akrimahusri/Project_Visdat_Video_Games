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
  const decadeData = d3.rollup(dataset, v => d3.sum(v, d => d.Global_Sales), d => Math.floor(d.Year_of_Release / 10) * 10);

  // Membuat array dari decadeData, mengurutkan berdasarkan urutan kronologis
  const decadeArray = Array.from(decadeData, ([key, value]) => ({
    decade: `${key}s`, 
    sales: value
  })).sort((a, b) => parseInt(a.decade) - parseInt(b.decade));

  // Menghapus dekade 2020-an jika tidak ada data penjualan yang relevan
  const filteredDecadeArray = decadeArray.filter(d => d.decade !== "2020s");

  const margin = { top: 20, right: 40, bottom: 60, left: 70};// Menambahkan margin untuk label
  const width = 1000 - margin.left - margin.right;
  const height = 500 - margin.top - margin.bottom;

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

  // Tooltip untuk menampilkan info saat hover
  const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0);

  // Bar chart dengan tooltip
  svgDecade.selectAll(".bar")
      .data(filteredDecadeArray)
      .enter().append("rect")
      .attr("class", "bar black-bar")  // Tambahkan kelas 'black-bar' untuk bar di grafik ini
      .attr("x", d => xDecade(d.decade))
      .attr("y", d => yDecade(d.sales))
      .attr("width", xDecade.bandwidth())
      .attr("height", d => height - yDecade(d.sales))
      .on("mouseover", function(event, d) {
          tooltip.transition().duration(200).style("opacity", .9);
          tooltip.html(`${d.decade}: ${d.sales.toFixed(2)} Juta`)
              .style("left", (event.pageX + 5) + "px")
              .style("top", (event.pageY - 28) + "px");
      })
      .on("mouseout", function(d) {
          tooltip.transition().duration(500).style("opacity", 0);
      });

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

    // Label X (Dekade)
    svgDecade.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom - 10)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "black")
        .text("Dekade");

    // Label Y (Penjualan)
    svgDecade.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 20)
        .attr("text-anchor", "middle")
        .style("font-size", "14px")
        .style("fill", "black")
        .text("Global Sales (Juta)");

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

document.addEventListener('DOMContentLoaded', () => {
    fetch('data/video_games_cleaned.csv')
      .then(response => response.text())
      .then(csvData => {
        const data = parseCSV(csvData);
  
        const ctx1 = document.getElementById('chart1').getContext('2d');
        
        const ctx2 = document.getElementById('chart2').getContext('2d');
  
        // Data untuk Perbandingan Penjualan di Berbagai Region
        const data1 = {
          labels: ['Wii Sports', 'GTA V', 'Minecraft', 'Tetris', 'Mario Kart 8', 'PUBG', 'Pokemon Red/Blue', 'Wii Fit', 'Pac-Man', 'Duck Hunt'],
          datasets: [
            {
              label: 'North America Sales',
              data: [41.49, 23.2, 21.04, 23.2, 14.02, 6.81, 11.27, 8.94, 7.81, 26.93],
              backgroundColor: 'rgba(75, 192, 192, 0.7)'
            },
            {
              label: 'Europe Sales',
              data: [29.02, 20.17, 14.45, 2.26, 12.76, 9.16, 8.89, 8.03, 0.28, 0.63],
              backgroundColor: 'rgba(255, 159, 64, 0.7)'
            },
            {
              label: 'Jepang Sales',
              data: [3.77, 0.97, 3.54, 4.22, 1.66, 0.13, 10.22, 3.6, 3.93, 0.28],
              backgroundColor: 'rgba(153, 102, 255, 0.7)'
            },
            {
              label: 'Other Sales',
              data: [8.94, 4.12, 2.84, 3.45, 5.32, 3.17, 2.51, 2.02, 1.65, 0.95],
              backgroundColor: 'rgba(255, 99, 132, 0.7)' // Different color for Other Sales
            }
          ]
        };
  
        // Konfigurasi Grouped Bar Chart
        const config1 = {
          type: 'bar',
          data: data1,
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Perbandingan Penjualan di Berbagai Region',
                font: {
                  size: 18
                }
              },
              tooltip: {
                mode: 'index',
                intersect: false
              },
              datalabels: {
                anchor: 'end',
                align: 'top',
                color: '#000',
                font: {
                  weight: 'bold',
                  size: 11
                },
                formatter: (value) => value
              }
            },
            interaction: {
              mode: 'nearest',
              axis: 'x',
              intersect: false
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Jutaan Unit'
                }
              }
            }
          },
          plugins: [ChartDataLabels]
        };
        
  
        new Chart(ctx1, config1);
  
        // Mengambil data untuk histogram
        const userScores = data.map(game => game.User_Score).filter(score => score !== null);
  
        const histogramData = {
          labels: ['0-1', '1-2', '2-3', '3-4', '4-5', '5-6', '6-7', '7-8', '8-9', '9-10'],
          datasets: [{
            label: 'Distribusi Skor Pengguna',
            data: createHistogram(userScores),
            backgroundColor: 'rgba(54, 162, 235, 0.7)'
          }]
        };
  
  
  
        // Konfigurasi Histogram
        const config2 = {
          type: 'bar',
          data: histogramData,
          options: {
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Distribusi Skor Pengguna (User_Score)',
                font: {
                  size: 18
                }
              },
              tooltip: {
                callbacks: {
                  label: (context) => `${context.dataset.label}: ${context.parsed.y} game`
                }
              },
              
              datalabels: {
                anchor: 'end',
                align: 'top',
                color: '#000',
                font: {
                  weight: 'bold'
                },
                formatter: Math.round
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Jumlah Game'
                }
              }
            }
          },
          plugins: [ChartDataLabels]
        };
  
        new Chart(ctx2, config2);
      });
  });
  
  // Fungsi untuk mengonversi CSV ke array of objects
  function parseCSV(csv) {
    const rows = csv.split('\n');
    const headers = rows[0].split(',');
    const data = rows.slice(1).map(row => {
      const values = row.split(',');
      const obj = {};
      values.forEach((value, index) => {
        obj[headers[index]] = value;
      });
      return obj;
    });
    return data;
  }
  
  // Fungsi untuk membuat histogram berdasarkan rentang skor
  function createHistogram(scores) {
    const bins = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const histogram = new Array(bins.length - 1).fill(0);
  
    scores.forEach(score => {
      for (let i = 0; i < bins.length - 1; i++) {
        if (score >= bins[i] && score < bins[i + 1]) {
          histogram[i]++;
          break;
        }
      }
    });
  
    return histogram;
  }

//scatterplot 
const svg = d3.select("#scatterPlot");
const margin = { top: 50, right: 50, bottom: 50, left: 60 };
const width = +svg.attr("width") - margin.left - margin.right;
const height = +svg.attr("height") - margin.top - margin.bottom;

d3.csv("data/video_games_cleaned.csv").then(data => {
  data.forEach(d => {
    d.Critic_Score = +d.Critic_Score * 10; // Konversi skala ke 0–100
    d.Global_Sales = +d.Global_Sales;
  });

  // Isi dropdown 
  const genres = Array.from(new Set(data.map(d => d.Genre))).sort();
  const dropdown = d3.select("#genreFilter");
  genres.forEach(genre => {
    dropdown.append("option")
      .attr("value", genre)
      .text(genre);
  });

  // Tambahkan tooltip
   const tooltip = d3.select("body").append("div")
  .attr("class", "tooltip");

  function updateChart(filteredData) {
    svg.selectAll("*").remove();

    const x = d3.scaleLinear().domain([0, 100]).range([margin.left, width + margin.left]);
    const y = d3.scaleLinear().domain([0, d3.max(filteredData, d => d.Global_Sales)]).range([height + margin.top, margin.top]);

    svg.append("g")
      .attr("transform", `translate(0, ${height + margin.top})`)
      .call(d3.axisBottom(x));

    svg.append("g")
      .attr("transform", `translate(${margin.left}, 0)`)
      .call(d3.axisLeft(y));

    // Label X
    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", height + margin.top + 40)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text("Critic Score");

    // Label Y
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", margin.left - 45)
        .attr("x", -height / 2 - margin.top)
        .attr("text-anchor", "middle")
        .attr("font-size", "14px")
        .text("Global Sales (millions)");

    svg.append("text")
        .attr("x", width / 2 + margin.left)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .attr("font-size", "18px")
        .attr("font-weight", "bold")
        .text("Critic Score vs Global Sales");

    svg.selectAll("circle")
      .data(filteredData)
      .enter()
      .append("circle")
      .attr("cx", d => x(d.Critic_Score))
      .attr("cy", d => y(d.Global_Sales))
      .attr("r", 4)
      .style("fill", "#69b3a2")
      .style("opacity", 0.7)

      .on("mouseover", function (event, d) {
        d3.select(this)
          .transition()
          .duration(100)
          .attr("r", 6)
          .style("opacity", 1);
      
        tooltip.transition()
          .duration(200)
          .style("opacity", 0.9);
      
        tooltip.html(`
          <strong>${d.Name}</strong><br>
          Critic: ${d.Critic_Score}<br>
          Sales: ${d.Global_Sales}M
        `)
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY - 28) + "px");
      })      

    // Regresi linear
    const xMean = d3.mean(filteredData, d => d.Critic_Score);
    const yMean = d3.mean(filteredData, d => d.Global_Sales);
    const num = d3.sum(filteredData, d => (d.Critic_Score - xMean) * (d.Global_Sales - yMean));
    const den = d3.sum(filteredData, d => Math.pow(d.Critic_Score - xMean, 2));
    const slope = num / den;
    const intercept = yMean - slope * xMean;

    const regLine = d3.line()
      .x(d => x(d.Critic_Score))
      .y(d => y(slope * d.Critic_Score + intercept));

    svg.append("path")
      .datum([{ Critic_Score: 0 }, { Critic_Score: 100 }])
      .attr("d", regLine)
      .attr("stroke", "red")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", "5,5")
      .attr("fill", "none");

    // R-squared
    const ssTot = d3.sum(filteredData, d => Math.pow(d.Global_Sales - yMean, 2));
    const ssRes = d3.sum(filteredData, d => Math.pow(d.Global_Sales - (slope * d.Critic_Score + intercept), 2));
    const rSquared = 1 - ssRes / ssTot;

    svg.append("text")
      .attr("x", width + margin.left - 100)
      .attr("y", margin.top + 10)
      .attr("text-anchor", "end")
      .attr("font-size", "13px")
      .attr("fill", "red")
      .text(`R² = ${rSquared.toFixed(3)}`);
  }

  // Tampilkan semua data saat awal
  updateChart(data);

  // Update saat genre berubah
  dropdown.on("change", function () {
    const selected = this.value;
    const filtered = selected === "All" ? data : data.filter(d => d.Genre === selected);
    updateChart(filtered);
  });
});



// Regional Sales Comparison Chart
function createRegionalSalesChart(data) {
    const ctx = document.getElementById('regionalChart').getContext('2d');
    
    // Process data to get top games by global sales
    const topGames = data.sort((a, b) => b.Global_Sales - a.Global_Sales)
                        .slice(0, 10)
                        .map(d => d.Name);

    const regionalData = {
        labels: topGames,
        datasets: [
            {
                label: 'North America Sales',
                data: data.filter(d => topGames.includes(d.Name))
                         .sort((a, b) => b.Global_Sales - a.Global_Sales)
                         .map(d => d.NA_Sales),
                backgroundColor: 'rgba(75, 192, 192, 0.7)'
            },
            {
                label: 'Europe Sales',
                data: data.filter(d => topGames.includes(d.Name))
                         .sort((a, b) => b.Global_Sales - a.Global_Sales)
                         .map(d => d.EU_Sales),
                backgroundColor: 'rgba(255, 159, 64, 0.7)'
            },
            {
                label: 'Japan Sales',
                data: data.filter(d => topGames.includes(d.Name))
                         .sort((a, b) => b.Global_Sales - a.Global_Sales)
                         .map(d => d.JP_Sales),
                backgroundColor: 'rgba(153, 102, 255, 0.7)'
            },
            {
                label: 'Other Sales',
                data: data.filter(d => topGames.includes(d.Name))
                         .sort((a, b) => b.Global_Sales - a.Global_Sales)
                         .map(d => d.Other_Sales),
                backgroundColor: 'rgba(255, 99, 132, 0.7)'
            }
        ]
    };

    new Chart(ctx, {
        type: 'bar',
        data: regionalData,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Top Games Sales by Region',
                    font: { size: 18 }
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                },
                datalabels: {
                    display: false 
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Sales (in millions)'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Games'
                    }
                }
            }
        }
    });
}

// User Score Distribution Chart
function createUserScoreChart(data) {
    const ctx = document.getElementById('histogramChart').getContext('2d');
    
    // Process user scores
    const userScores = data.map(d => d.User_Score ? +d.User_Score : null)
                          .filter(score => score !== null);
    
    // Create histogram bins
    const bins = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const histogram = new Array(bins.length - 1).fill(0);

    userScores.forEach(score => {
        for (let i = 0; i < bins.length - 1; i++) {
            if (score >= bins[i] && score < bins[i + 1]) {
                histogram[i]++;
                break;
            }
        }
    });

    const histogramData = {
        labels: bins.slice(0, -1).map((bin, i) => `${bin}-${bins[i+1]}`),
        datasets: [{
            label: 'Number of Games',
            data: histogram,
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
        }]
    };

    new Chart(ctx, {
        type: 'bar',
        data: histogramData,
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Distribution of User Scores',
                    font: { size: 18 }
                },
                tooltip: {
                    callbacks: {
                        label: (context) => `${context.parsed.y} games`
                    }
                },
                datalabels: {
                    anchor: 'end',
                    align: 'top',
                    color: '#000',
                    font: { weight: 'bold' },
                    formatter: Math.round
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Number of Games'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'User Score Range'
                    }
                }
            }
        },
        plugins: [ChartDataLabels]
    });
}


d3.csv("data/video_games_cleaned.csv").then(dataset => {

    createRegionalSalesChart(dataset);
    createUserScoreChart(dataset);
}).catch(error => {
    console.error("Error loading the CSV data: ", error);
});

