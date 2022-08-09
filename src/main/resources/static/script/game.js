var gameMap;
var bounds;
var places;
var selectedPlaceIndex = -1;
var placeListButtons;
var pins;
var totalPlaced;
var scores;

//
function doIt() {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        if(xhr.readyState == XMLHttpRequest.DONE) {
            if(xhr.status == 200) {
                //let response = JSON.parse(xhr.response);
                let newGameData = parseResponse(xhr.response);
                startGame(newGameData);
            } else {
                // TODO - Handle error
                alert("ERROR " + xhr.status);
            }
        }
    };
    document.getElementById("start-btn").disabled = true;
    let request = document.getElementById("location-query").value;
    xhr.open("POST", "/game/new");
    xhr.setRequestHeader("content-type", "application/json");
    xhr.send(request);
}


//
function parseResponse(response) {
    let fullResponse = JSON.parse(response);
    let newPlaces = [];
    let i = 0;
    for(; i < fullResponse.results.length; i++) {
        let result = fullResponse.results[i];
        let place = {
            name: result.name,
            latLong: result.geocodes.main
        };
        newPlaces.push(place);
    }

    // TODO - GeoBounds for non-circles? Will this come up?
    let newGameData = {
        nearQuery: document.getElementById("location-query").value,
        latLong: fullResponse.context.geo_bounds.circle.center,
        radius: fullResponse.context.geo_bounds.circle.radius,
        places: newPlaces
    }
    return newGameData;
}


//
function startGame(newGameResponse) {
    document.getElementById("game-header").textContent = "How well do you know " + newGameResponse.nearQuery + "?";
    let latitude = newGameResponse.latLong.latitude;
    let longitude = newGameResponse.latLong.longitude;
    let radius = newGameResponse.radius;
    // TODO - See placesearch admin for some really good zoom to fit code.
    gameMap.flyTo([latitude, longitude], 12);
    setTimeout(function(){
        drawGeoBounds(latitude, longitude, radius);
    }, 3000);

    places = newGameResponse.places;
    pins = [];
    placeListButtons = [];
    totalPlaced = 0;
    scores = [];
    let placeList = document.getElementById('place-list');
    // TODO - Remove all children of place list somewhere?
    let i = 0;
    for(; i < places.length; i++) {
        let placeListItem = buildPlaceListItem(i);
        placeList.appendChild(placeListItem);
    }
}


//
function buildPlaceListItem(placeIndex) {
    let placeListItem = document.createElement("li");
    placeListItem.classList.add("place-list-item");
    let placeItemBtn = document.createElement("div");
    placeItemBtn.classList.add("place-list-btn");
    placeItemBtn.innerHTML = places[placeIndex].name;
    placeItemBtn.addEventListener("click", function(event) {
        let li = event.target.parentElement;
        let index = Array.from(li.parentElement.children).indexOf(li);
        // TODO - Add highlighting for pins when the corresponding place is selected.
        // Deselect previous place
        if(selectedPlaceIndex != -1) {
            let previouslySelected = li.parentElement.children[selectedPlaceIndex].firstChild;
            previouslySelected.classList.remove("place-list-btn-selected");
        }
        // Make new place selected if it wasn't already.
        if(selectedPlaceIndex == index) {
            selectedPlaceIndex = -1;
        } else {
            selectedPlaceIndex = index;
            event.target.classList.add("place-list-btn-selected");
        }
    });
    placeListItem.appendChild(placeItemBtn);
    placeListButtons.push(placeItemBtn);

    let placeScore = document.createElement("span");
    placeScore.classList.add("place-list-score")
    placeListItem.appendChild(placeScore);
    scores.push(placeScore);

    let marker = L.marker([0, 0]);
    marker.bindPopup(places[placeIndex].name + "<br>(guess)");
    pins.push(marker);

    return placeListItem;
}


//
function drawGeoBounds(latitude, longitude, radius) {
    bounds = L.circle([latitude, longitude], {
        color: 'red',
        fill: false,
        radius: radius
    }).addTo(gameMap);
}


// TODO - Set selected place function


//
function initMap() {
    // "toner", "terrain" or "watercolor"
    gameMap = L.map("map").setView([0, 0], 2);

    var layer = new L.StamenTileLayer("watercolor");
    gameMap.addLayer(layer);

    // The FSQ place search admin way
    // L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
    //     attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
    //     maxZoom: 18,
    //     id: 'mapbox/streets-v11',
    //     tileSize: 512,
    //     zoomOffset: -1,
    //     accessToken: 'pk.eyJ1IjoiZm91cnNxdWFyZSIsImEiOiJjRGRqOVZZIn0.rMLhJeqI_4VnU2YdIJvD3Q'
    // }).addTo(map);
}

function onMapClick(e) {
    if(selectedPlaceIndex != -1) {
        pins[selectedPlaceIndex].remove();
        pins[selectedPlaceIndex].setLatLng(e.latlng);
        pins[selectedPlaceIndex].addTo(gameMap);
        if(!placeListButtons[selectedPlaceIndex].classList.contains("place-list-btn-pinned")) {
            placeListButtons[selectedPlaceIndex].classList.add("place-list-btn-pinned");
            totalPlaced++;
            if(totalPlaced >= places.length) {
                document.getElementById("submit-btn").disabled = false;
            }
        }

    }
}


//
function showAnswers() {
    document.getElementById("submit-btn").disabled = true;
    selectedPlaceIndex = -1;
    let totalScore = 0;
    let i = 0;
    for(; i < places.length; i++) {
        let aLat = places[i].latLong.latitude;
        let aLng = places[i].latLong.longitude;
        let answerPin = L.marker([aLat, aLng]).bindPopup(places[i].name + "<br>(actual)").addTo(gameMap);
        let guessPin = pins[i];

        let dist = Math.round(answerPin.getLatLng().distanceTo(guessPin.getLatLng()));
        totalScore += dist;
        scores[i].innerHTML = dist + "m";

        L.polyline([answerPin.getLatLng(), guessPin.getLatLng()], {color: 'red'}).addTo(gameMap);
    }
    document.getElementById("total-score").innerHTML = "Total: " + totalScore + "m";
}


//
window.onload = function() {
    initMap();
    gameMap.on('click', onMapClick);
}

// TODO
//  - Button to submit answers once everything has been placed.
//  - Go through each place, drop a different colored pin for actual location and connect the two with a line.
//  - Calculate distances between guess / actual and add that up as the final score.