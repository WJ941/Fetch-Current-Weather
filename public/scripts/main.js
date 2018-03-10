class Layout {
  constructor(container) {
    this.container = container
    this.changetoWea()
  }
  changetoWea() {
    return new Promise( (resolve, reject) => {
      this.container.innerHTML = `
        <div class="geoloc">
        </div>
        <div class="wea-now">
        </div>
        <div class="wea-daily">
        </div>
        <div class="wea-hourly">
        </div>
        <div class="wea-lifestyle">
        </div>
      `
      resolve()
    })
    
  }
  changetoPlace() {
    this.container.innerHTML = `
    `
  }
}
var content = document.querySelector('.container');
var layout = new Layout(content)

async function _main(position) {
  await layout.changetoWea()
  function generatePos(position) {
    // 获得经纬度
    function getGeolocation() {
      // HTML5 定位
      function html5Geo(resolve, reject) {
        var options = {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 60 * 60 * 1000,
        }
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(pos => {
            var crd = pos.coords;
            resolve({latitude: crd.latitude, longitude: crd.longitude})
          }, err => {
            reject(new Error('some error ocurs in gelocation: ' + err.message))
          }, options)
        } else {
          reject("Geolocation is not supported by this browser.") 
        }
      }
      // 腾讯定位服务
      function tencentGeo(resolve, reject) {
        var geolocation = new qq.maps.Geolocation('2FDBZ-JAO3X-LYS4A-TCVUQ-MDTCS-ZGFZP', 'weather');
        var options = {timeout: 9000};
        function getCurLocation() {
            geolocation.getLocation(showPosition, showErr, options);
        };
        function showPosition(position) {
          console.log(position)
          resolve({
            latitude: position.lat,
            longitude: position.lng,
          })
        };
        function showErr() {
          console.log(arguments)
          reject(arguments)
        };
        getCurLocation()
      }
      return new Promise((resolve, reject )=> {
        try {
          html5Geo(resolve, reject)
        } catch(e) {
          tencentGeo(resolve, reject)
        }
      })
    }
    return new Promise( async (resolve, reject) => {
      if(!position) {
        try {
          position = await getGeolocation()
        } catch(e) {
          alert(e)
          return
        }
        // position = {
        //   latitude: position.lat,
        //   longitude: position.lng,
        // }
        position = position.longitude + ',' + position.latitude
      }
      log('get location: ', position)
      resolve(position)
    })
  }
  function generateAQI(position) {
    // 获得城市英文名称
    function getCityName(position) {
      var key = 'a40ac9db1e17446d928be71ecddec674'
      var url = `https://free-api.heweather.com/s6/search?lang=en&location=${position}&key=${key}`
      return AjaxGet(url)
    }
    return new Promise( async (resolve, reject) => {
      try {
        var res = await getCityName(position)
      } catch(e) {
        alert(e)
      }
      log('get city name: ', position)
      var city = JSON.parse(res).HeWeather6[0].basic.parent_city
      log('get city name: ', city)
      _aqiFeed({container:"city-aqi-container", lang:"cn" , city: city})
      resolve()
    })
  }
  function generateWeaNow(position) {
    var geoLoc = model.geoLoc
    var weather = model.weather
    observer(geoLoc)
    observer(weather)
    // 获得实时预报
    function getWeaNow(position) {
      var key = 'a40ac9db1e17446d928be71ecddec674'
      var url = `https://free-api.heweather.com/s6/weather/now?location=${position}&key=${key}`
      return AjaxGet(url)
    }
    //  计算限行
    function computeDriveDistrict() {
      var dayOfWeek = (new Date()).getDay()
      var districtNum = [
        null,
        [1,6],
        [2,7],
        [3, 8],
        [4,9],
        [5,0],
        null,
      ]
      if(districtNum[dayOfWeek]) {
        return `尾号限行${districtNum[dayOfWeek][0]}和${districtNum[dayOfWeek][1]}`
      } else {
        return "不限行"
      }
    }
    
    return new Promise( async (resolve, reject) => {
      // 和风天气 实时天气
      var weatherData = await getWeaNow(position)
      weatherData = JSON.parse(weatherData)
      log('get weather now',weatherData)
      // 更新地址
      geoLoc.data.posData = weatherData.HeWeather6[0].basic
      layout.container.querySelector('.geoloc').appendChild(geoLoc.target)
      // 更新实时天气
      weatherData.HeWeather6[0].now.reporttime = timestampConverter(Date.parse(weatherData.HeWeather6[0].update.loc))
      weatherData.HeWeather6[0].now.licenseNum = computeDriveDistrict()
      weather.data.weaData = weatherData.HeWeather6[0].now
      layout.container.querySelector('.wea-now').appendChild(weather.target)
      resolve()
    })
  }
  function generateDailyForecast(position) {
    var forecasts = model.forecasts
    observer(forecasts)
    // 获得3-10天预报
    function getDailyForecast(position) {
      var key = 'a40ac9db1e17446d928be71ecddec674'
      var url = `https://free-api.heweather.com/s6/weather/forecast?location=${position}&key=${key}`
      return AjaxGet(url)
    }
    return new Promise( async (resolve, reject) => {
      var res = await getDailyForecast(position)
      res = JSON.parse(res)
      var dailyForecast  = res.HeWeather6[0].daily_forecast
      log('get 3-10 天预报： ', dailyForecast)
      forecasts.data.casts = dailyForecast
      layout.container.querySelector('.wea-daily').appendChild(forecasts.target)
      resolve()
    })
  }
  function generateHourlyForecast(position) {
    var hourlyWea = model.hourlyWea
    observer(hourlyWea)
    // 获得逐小时预报
    function getHourlyWea(position) {
      // position  经度,纬度
      var key = 'a40ac9db1e17446d928be71ecddec674'
      var url = `https://free-api.heweather.com/s6/weather/hourly?location=${position}&key=${key}`
      return AjaxGet(url)
    }
    return new Promise( async (resolve, reject) => {
      //  和风天气 hourly weather 
      log('get hourly : ', position)
      var res = await getHourlyWea(position)
      res = JSON.parse(res)
      log('get hourly : ', res)
      hourlyWea.data.hourlyData = res.HeWeather6[0].hourly
      layout.container.querySelector('.wea-hourly').appendChild(hourlyWea.target)
      resolve()
    })
  }
  function generateLifestyle(position) {
    var lifestyle = model.lifestyle
    observer(lifestyle)
    // 获得生活指数
    function getLifestyle(position) {
      var key = 'a40ac9db1e17446d928be71ecddec674'
      var url = `https://free-api.heweather.com/s6/weather/lifestyle?location=${position}&key=${key}`
      return AjaxGet(url)
    }
    return new Promise( async (resolve, reject) => {
      var res = await getLifestyle(position)
      res = JSON.parse(res)
      log('get lifestyle: ', res)
      lifestyle.data.lifestyle = res.HeWeather6[0].lifestyle
      layout.container.querySelector('.wea-lifestyle').appendChild(lifestyle.target)
      resolve()
    })
  }
  position = await generatePos(position)
  await generateWeaNow(position)
  await generateAQI(position)
  await generateDailyForecast(position)
  await generateHourlyForecast(position)
  await generateLifestyle(position)
}