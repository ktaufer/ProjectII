function init() {
    // import sightings data
    d3.csv('bird_sightings.csv').then(function(birdData) {
       
        var sightingMarkers = [];
        var countries = [];
        // contruct markers and list of countries
        for (var i = 0; i < birdData.length; i++) {
            var record = birdData[i];
            var marker = L.marker([record.Latitude, record.Longitude], {
                draggable: false,
                title: `${record.Recording_ID}`
            }).bindPopup(`<h4>${record.English_name} (${record.Species})</h4><hr><h5>Recording: ${record.Vocalization_type}, ${record.Country}</h5>`);
            marker.on('click', function(e){
                buildDashboard(this);
            });
            sightingMarkers.push(marker);
            
            countries.push(record.Country);
        };
        
        // populate drop-down menu with unique countries
        var distinctCountries = [... new Set(countries)];
        var menu = d3.select('#countries');
        menu.selectAll('option')
            .data(distinctCountries)
            .enter()
            .append("option")
            .property('value', d => d)
            .text(d => d)

        // populate plot with comparison data per country
        var countriesCount = {};
        countries.forEach(function(d) {
            if (d in countriesCount){
                countriesCount[d] +=1;
            } else {
                countriesCount[d] = 1;
            };
        });
        var keys = Object.keys(countriesCount);
        var values = Object.values(countriesCount);
        var data = [{
            x: keys,
            y: values,
            type: 'bar'
        }];
        var layout = {
            title: 'Bird Sightings per Country',
            xaxis: {title: 'Country'},
            yaxis: {title: 'Number of Sightings/Recordings'}
        };
        Plotly.newPlot('plot', data, layout);

        // make map 
        var markerLayer = L.layerGroup(sightingMarkers);
        var satellitemap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
            attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
            maxZoom: 18,
            id: "mapbox.satellite",
            accessToken: API_KEY
        });
        var lightmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
            attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
            maxZoom: 18,
            id: "mapbox.light",
            accessToken: API_KEY
        });
        var darkmap = L.tileLayer("https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}", {
            attribution: "Map data &copy; <a href=\"https://www.openstreetmap.org/\">OpenStreetMap</a> contributors, <a href=\"https://creativecommons.org/licenses/by-sa/2.0/\">CC-BY-SA</a>, Imagery © <a href=\"https://www.mapbox.com/\">Mapbox</a>",
            maxZoom: 18,
            id: "mapbox.dark",
            accessToken: API_KEY
        });
        var baseMaps = {
            'Light': lightmap,
            'Satellite': satellitemap,
            'Dark': darkmap
        };
        var overlayMaps = {
            'Bird Sightings': markerLayer
        };
        var myMap = L.map('map', {
            center:  [54.5260, 15.2551],
            zoom: 3,
            layers: [lightmap, markerLayer]
        });
        L.control.layers(baseMaps, overlayMaps, {collapsed: false}).addTo(myMap);
    
        // prime audio div with first record
        var audioBox = d3.select('#audio');
        var bird1 = birdData[0]
        audioBox.select('.card')
            .selectAll('img')
            .attr('src', bird1.Spectrogram_med)
            .selectAll('.card-title')
            .html(`<h4>${bird1.English_name} (${bird1.Species})</h4>`);
        audioBox.select('.card-body')
            .selectAll('audio')
            .attr('src', bird1.mp3_url);
        audioBox.select('.card-body')
            .append('p')
            .text(`Recorded by: ${bird1.Recordist} on ${bird1.Date}`)
    
        var image = d3.select('#image')
        // load image data, append to image div    
        d3.csv('images.csv').then(function(imageData){
            var image = d3.select('#image')
            var record = imageData[0]
            image.append('h3').text(`Images of ${bird1.English_name} (${bird1.Species})`)
            image.append('img').attr('src', record.Image1).attr('alt', record.Species);
            image.append('img').attr('src', record.Image2).attr('alt', record.Species);
            image.append('img').attr('src', record.Image3).attr('alt', record.Species);
            image.append('img').attr('src', record.Image4).attr('alt', record.Species);
            image.append('img').attr('src', record.Image5).attr('alt', record.Species);
            image.append('img').attr('src', record.Image6).attr('alt', record.Species);
        });
    }); 
};

init()

// rebuild dashboard whenever a marker is clicked
function buildDashboard(marker) {
    // import sightings data
    d3.csv('bird_sightings.csv').then(function(sightings) {
        var image = d3.select('#image')
        image.html('');
        // pull data based on the marker title
        for (i = 0; i < sightings.length; i++) {
            var sighting = sightings[i];
            if (marker.options.title == sighting.Recording_ID) {
                var audioFileSrc = sighting.mp3_url;
                var speciesName = sighting.Species;
                var spectrogram = sighting.Spectrogram_med;
                var recordist = sighting.Recordist;
                var date = sighting.Date;
                var type = sighting.Vocalization_type;
                var commonName = sighting.English_name;               
            };
        };
        // load data from images csv that matches the species on the marker
        d3.csv('images.csv').then(function(imageData) {
            for (var j = 0; j < imageData.length; j++) {
                var entry = imageData[j];
                if (entry.Species == speciesName){
                    // add new title and images to the image div
                    image.append('h3').text(`Images of ${commonName} (${speciesName})`);
                    image.append('img').attr('src', entry.Image1).attr('alt', `${entry.Species}, image1`);
                    image.append('img').attr('src', entry.Image2).attr('alt', `${entry.Species}, image2`);
                    image.append('img').attr('src', entry.Image3).attr('alt', `${entry.Species}, image3`);
                    image.append('img').attr('src', entry.Image4).attr('alt', `${entry.Species}, image4`);
                    image.append('img').attr('src', entry.Image5).attr('alt', `${entry.Species}, image5`);
                    image.append('img').attr('src', entry.Image6).attr('alt', `${entry.Species}, image6`);
                };
            };
        });
        // add spectrogram, audio clip to audio div
        var audioBox = d3.select('#audio');
        audioBox.select('.card')
            .selectAll('img')
            .attr('src', spectrogram)
            .attr('alt', speciesName);
        audioBox.select('.card-body')
            .selectAll('.card-title')
            .html(`<h4>${commonName} (${speciesName})</h4>`);
        audioBox.select('.card-body')
            .selectAll('audio')
            .attr('src', audioFileSrc);
        
        var credits = audioBox.select('.card-body').selectAll('p');
        credits.text('');
        credits.text(`Recorded by: ${recordist} on ${date}`);
    });      
};

// build new plot when country is changed
function changePlot(country) {
    console.log(country)
    d3.csv('bird_sightings.csv').then(function(sightingData) {

        // get data for selected country
        var countryData = sightingData.filter(function(d) {
            if(d.Country == country){
                return d
            }
        });
  
        // create species count for country
        var result = [];
        countryData.reduce(function(res, value) {
            if (!res[value.Species]) {
                res[value.Species] = { Species: value.Species, qty: 0 };
                result.push(res[value.Species])
            }
            res[value.Species].qty += 1;
            return res;
        });
        
        //chart species count data
        var labels = result.map(d => d.Species);
        var values = result.map(d => d.qty);
        var data = [{
            values: values,
            labels: labels,
            type: 'pie'
        }];
        var layout = {
            title: `${country} Sightings per Species`
        }
        Plotly.newPlot('plot', data, layout);
    });
};

function optionChanged(country) {
    d3.event.preventDefault();
    var country = d3.select("#countries").node().value;
    // d3.select("#countries").node().value = "";
    changePlot(country);
};
d3.select("#countries").on("change", optionChanged);
