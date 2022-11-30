let listOfChargingStation = []; // array storing fetched data from excel file
let listOfASCenter = []; // array storing fetched data from csv file
let geocoder; // parse address to coordinate
let map; // google map instance
const pathOfChargingStationData = "./asset/jeju-ev-charging-station-list.xlsx"; // relative path of charing station excel data
const pathOfASCenterData = "./asset/jeju-ev-as-center.xlsx"; //  relative path of as center csv data

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
  let data = await fetchData(pathOfChargingStationData);
  await loadData(data, "charging");
  data = await fetchData(pathOfASCenterData);
  await loadData(data, "as");

  const bounds = new google.maps.LatLngBounds();
  const infoWindow = new google.maps.InfoWindow();

  // add charing station marker to map (red color)
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

  // add as center marker to map (blue color)
  listOfASCenter.forEach(
    ({
      category,
      manufacturer,
      name,
      address,
      contact,
      renewed_date,
      latitude,
      longitude,
    }) => {
      // ignore data whose position is invalid or located in jeju island
      if (latitude === 0 || latitude > 33.9) {
        return;
      }
      const latlng = new google.maps.LatLng(latitude, longitude);

      const marker = new google.maps.Marker({
        position: latlng,
        map: map,
        icon: {
          url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          scaledSize: new google.maps.Size(60, 60),
        },
      });
      bounds.extend(marker.position);

      marker.addListener("click", () => {
        map.panTo(marker.position);
        const info = `<p><b>이름 : ${name}</b></p><p>제조판매사 : ${manufacturer}</p><p>구분 : ${category}</p>
        <p>주소 : ${address}</p><p>전화번호 : ${contact}</p><p>갱신일 : ${renewed_date}</p>`;
        infoWindow.setContent(info);

        infoWindow.open({
          anchor: marker,
          map,
        });
      });
    }
  );

  map.fitBounds(bounds);
  // uncomment the following code snippet only when you want to parse addresss to coordinate
  // await extractCoordinateAndSaveAsCSV();
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
  for (var i = 0; i < listOfASCenter.length; i++) {
    row = [];
    const address = listOfASCenter[i].address;
    const name = listOfASCenter[i].name;
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

// value object for storing as center info
class ASCenter {
  constructor(data) {
    this.category = data.category.trim();
    this.manufacturer = data.manufacturer.trim();
    this.name = data.name.trim();
    this.address = data.address.trim();
    this.contact = data.contact.trim();
    this.latitude = data.latitude;
    this.longitude = data.longitude;
    this.renewed_date = data.renewed_date.trim();
  }
}

// read excel file and parse to blob
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
async function loadData(blob, category) {
  let workBook = XLSX.read(blob, { type: "binary" });
  let firstSheet = workBook.SheetNames[0];
  let rows = XLSX.utils.sheet_to_json(workBook.Sheets[firstSheet]);
  if (category === "charging") {
    rows.forEach((row) => {
      let chargingStation = new ChargingStation(row);
      listOfChargingStation.push(chargingStation);
    });
  } else if (category === "as") {
    rows.forEach((row) => {
      let asCenter = new ASCenter(row);
      listOfASCenter.push(asCenter);
    });
  } else {
    console.log("invalid category");
  }
}
