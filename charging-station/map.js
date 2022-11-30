let listOfChargingStation = []; // array storing fetched data from excel file
let geocoder; // parse address to coordinate
let map; // google map instance

window.initMap = async () => {
  // display google map ui
  const COORDINATE_JEJU_ISLAND = new google.maps.LatLng(
    33.3696213,
    126.5311884
  ); // latitude and longitude of jeju island
  const MAP_OPTIONS = {
    zoom: 10,
    center: COORDINATE_JEJU_ISLAND,
  };
  map = new google.maps.Map(document.getElementById("map"), MAP_OPTIONS);

  // fetch data
  setExcelFilePath("./asset/jeju-ev-charging-station-list.xlsx"); // set relative path of excel data file
  let data = await fetchData(getExcelFilePath());
  await loadData(data);

  const bounds = new google.maps.LatLngBounds();
  const infoWindow = new google.maps.InfoWindow();

  listOfChargingStation.forEach(
    ({
      agency,
      name,
      chargerId,
      chargerType,
      province,
      city,
      address,
      businessHours,
      isLimited,
      chargerCapactiy,
      chargeCost,
      latitude,
      longitude,
      note,
    }) => {
      // ignore data whose position is invalid or located in jeju island
      if (latitude === 0 || latitude > 33.9) {
        return;
      }
      const latlng = new google.maps.LatLng(latitude, longitude);

      const marker = new google.maps.Marker({
        position: latlng,
        map: map,
      });
      bounds.extend(marker.position);

      marker.addListener("click", () => {
        map.panTo(marker.position);
        const info = `<p><b>이름 : ${name}</b></p><p>운영기관 : ${agency}</p><p>충전기ID : ${chargerId}</p><p>충전기타입 : ${chargerType}</p>
        <p>지역 : ${province}</p><p>시군구 : ${city}</p><p>주소 : ${address}</p><p>이용가능시간 : ${businessHours}</p>
        <p>이용자제한 : ${isLimited}</p><p>충전용량 : ${chargerCapactiy}</p><p>충전요금(1kwh당) : ${chargeCost}</p><p>비고 : ${note}</p></p>`;
        infoWindow.setContent(info);

        infoWindow.open({
          anchor: marker,
          map,
        });
      });
    }
  );

  map.fitBounds(bounds);
};

// extract coordiante of charging station from excel file using geocoder
async function extractCoordinateAndSaveAsCSV() {
  geocoder = new google.maps.Geocoder();

  let csv = [];
  let row = [];

  row.push("name", "latitude", "longitude");
  csv.push(row.join(","));

  // recommend to split geocode requests into smaller chunks (i.e 200 times)
  // as the number of requests increases, google gradually increases throwing OVER_QUERY_LIMIT error
  for (var i = 0; i < listOfChargingStation.length; i++) {
    row = [];
    const address = listOfChargingStation[i].address;
    const name = listOfChargingStation[i].name;
    const location = await new Promise(function callback(resolve, rejected) {
      geocoder.geocode({ address: address }, (results, status) => {
        if (status === "OK") {
          resolve(results[0].geometry.location);
        } else if (status === google.maps.GeocoderStatus.OVER_QUERY_LIMIT) {
          // when geocode throw OVER_QUERY_LIMIT, call out this function recursively
          console.log(`OVER_QUERY_LIMIT...Try again`);
          sleep(1000);
          callback(resolve, rejected);
        } else if (status === google.maps.GeocoderStatus.ZERO_RESULTS) {
          // when geocode failed to parse address, set location with (0,0)
          let defaultCoordinate = new google.maps.LatLng(0.0, 0.0);
          resolve(defaultCoordinate);
        } else {
          console.log(`error code : ${status}`);
          rejected();
        }
      });
    });
    let str = `${location}`;
    str = str.replace(/[()]/g, "");
    let coordinate = str.split(",");
    let latitude = coordinate[0];
    let longitude = coordinate[1];
    row.push(name, latitude, longitude);
    console.log(
      `index: ${i}, name : ${name}, latitude : ${latitude}, longitude : ${longitude}`
    );
    csv.push(row.join(","));
    // sleep is is for preventing geocode throw OVER_QUERY_LIMIT error
    // which occurs when sending geocode request over 10 times in a second
    sleep(300);
  }

  const filename = "coordinates.csv";
  downloadCSV(csv.join("\n"), filename);
  alert("Extracting has completed!");
}

function downloadCSV(csv, filename) {
  var csvFile;
  var downloadLink;

  // it's for encoding korean language
  const BOM = "\uFEFF";
  csv = BOM + csv;

  csvFile = new Blob([csv], { type: "text/csv" });
  downloadLink = document.createElement("a");
  downloadLink.download = filename;
  downloadLink.href = window.URL.createObjectURL(csvFile);
  downloadLink.style.display = "none";
  document.body.appendChild(downloadLink);
  downloadLink.click();
}

function sleep(delay) {
  var start = new Date().getTime();
  while (new Date().getTime() < start + delay);
}

// value object for storing charging station info
class ChargingStation {
  constructor(data) {
    this.agency = data.agency.trim();
    this.name = data.name.trim();
    this.chargerId = data.charger_id.trim();
    this.chargerType = data.charger_type.trim();
    this.province = data.province.trim();
    this.city = data.city.trim();
    this.address = data.address.trim();
    this.businessHours = data.business_hours.trim();
    this.isLimited = data.is_limited.trim();
    this.chargerCapactiy = data.charger_capacity.trim();
    this.chargeCost = data.charge_cost.trim();
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.note = data.note.trim();
  }
}

// read data from excel file
async function fetchData(filePath) {
  const promise = await fetch(filePath);
  const blob = await promise.blob();

  let result = await new Promise((resolve) => {
    let fileReader = new FileReader();
    fileReader.onload = () => resolve(fileReader.result);
    fileReader.readAsBinaryString(blob);
  });

  return result;
}

// initialize array with given argument
async function loadData(blob) {
  let workBook = XLSX.read(blob, { type: "binary" });
  let firstSheet = workBook.SheetNames[0];
  let rows = XLSX.utils.sheet_to_json(workBook.Sheets[firstSheet]);
  rows.forEach((row) => {
    let chargingStation = new ChargingStation(row);
    listOfChargingStation.push(chargingStation);
  });
}

function setExcelFilePath(filePath) {
  this.excelFilePath = filePath;
}

function getExcelFilePath() {
  return this.excelFilePath;
}
