var model = {
  // 位置
  geoLoc: {
    el: '.location',
    template: `
      <p>
        <img src="./img/location-o.png"  width="26px" height="26px">
        <span> {{location}}， </span>
        <span>{{parent_city}}， </span>
        <span>{{admin_area}}， </span>
        <span>{{cnty}}</span>
        <a href='#/findmycity'>切换</a>
      </p>
    `,
    data: {
      posData: null,
    },
    target: document.createElement('div'),
    render() {
      this.target.innerHTML = templateReplace(this.template, this.data.posData)
    },
  },
  // 天气
  weather: {
    el: '.weather',
    template: `
      <p>
        <span class="wea-temp mr-10">{{tmp}}</span><span class="wea-temp-unit">°</span>
        <span><img src="/img/cond_icon_heweather/{{cond_code}}.png" alt=""></span>
        <span class="mr-10 ft-1-5">{{cond_txt}}</span><span class="pd-10 ft-1-5">{{reporttime}}更新</span>
        <!-- AQI -->
        <span id="city-aqi-container" class="ft-1-5"></span>  
      </p>
      <p class="ft-1-5">
        <span class="mr-10">
          <img src="./img/humidity.png"  width="26px" height="26px">
          湿度{{hum}}%
        </span>
        <span class="pd-10">
          <img src="./img/wind_power.png"  width="26px" height="26px">
          {{wind_dir}}{{wind_sc}}级
        </span>
        <span>{{licenseNum}}</span>
      </p>
    `,
    data: {
      weaData: null,
    },
    target: document.createElement('div'),
    render() {
      this.target.innerHTML = templateReplace(this.template, this.data.weaData)
    },
  },
  // 预报
  forecasts: {
    el: `
    `,
    template: `
      <tr>
        <td>{{date}}</td>
        <td><img width="50px" height="50px" src="/img/cond_icon_heweather/{{cond_code_d}}.png" alt="">
          <span>{{cond_txt_d}}</span>
        </td>
        <td>{{tmp_min}}° / {{tmp_max}}°</td>
        <td>{{wind_dir}}</td>
        <td>{{wind_sc}}</td>
      </tr>
    `,
    data: {
      casts:[]
    },
    target: document.createElement('div'),
    render() {
      this.target.innerHTML = `
        <table class="wrap forecast">
          <thead>
            <tr>
              <th>预报</th>
            </tr>
          </thead>
          <tbody class="forecasts">
          </tbody>
        </table>
      `
      var self = this
      this.data.casts.forEach( cast => {
        cast.date = forecastTimeConverter(new Date(cast.date))
        // sel(self.el).innerHTML += templateReplace(self.template, cast)
        self.target.querySelector('tbody').innerHTML += templateReplace(self.template, cast)
      })
    },
  },
  // 每小时天气折线图
  hourlyWea: {
  el: '',
  target: document.createElement('div'),
  data: {
    hourlyData: {}
  },
  render() {
    log('hourly: ', this.data.hourlyData)
    this.createHourslyView.bind(this)()
  },
  createHourslyView(data) {
    var data = this.data.hourlyData
    var margin = {top: 20, right: 20, bottom: 30, left: 50},
      width = 800 - margin.left - margin.right,
      height = 400 - margin.top - margin.bottom;
    this.target.innerHTML = ''
    var svg = d3.select(this.target)
      .append('svg')
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);
      
    var container = svg.append('g')
      .attr('class', 'content')
      .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
    var parseTime = d3.timeParse("%Y-%m-%d %H:%M");
    var x = d3.scaleTime()
      .domain(d3.extent(data, function(d) { 
        d.time = parseTime(d.time) 
        return d.time;
      }))
      .range([0, width]);
    var y = d3.scaleLinear()
      .domain([0, d3.max(data, function(d) { return Number(d.tmp); })])
      .range([height, 0]);

    var line = d3.line()
      .x(function(d) { return x(d.time); })
      .y(function(d) { return y(d.tmp); });
    var xAxis = d3.axisBottom(x)
      .ticks(8)
      .tickFormat(d3.timeFormat("%d日%H:%M"));
    var yAxis = d3.axisRight(y)
      .ticks(8)
    container.append("g")
      .call(customXAxis);
    container.append("g")
      .call(customYAxis);
      
      function customXAxis(g) {
        g.call(xAxis);
        g.attr("transform", "translate(0," + height + ")")
        g.select(".domain").remove();
        g.selectAll("line").remove();
        g.selectAll(".tick text")
          .attr('fill', 'white')
          .attr('font-size', '2em');
      }

      function customYAxis(g) {
        g.call(yAxis);
        g.attr("transform", "translate(" + -margin.left + ", 0)")
        g.select(".domain").remove();
        g.selectAll(".tick line").remove();
        g.append("text")
          .attr("y", 6)
          .attr("x", 100)
          .attr("dy", "0.71em")
          .attr("text-anchor", "end")
          .text("温度/°C");
        g.selectAll("text")
          .attr('fill', 'white')
          .attr('font-size', '2em');
      }
    // 折线
    container.append("path")
      .datum(data)
      .attr("fill", "none")
      .attr("stroke", "white")
      .attr("stroke-linejoin", "round")
      .attr("stroke-linecap", "round")
      .attr("stroke-width", 3)
      .attr("d", line);
      
    // 圆点
    var g = container.selectAll('circle')
      .data(data)
      .enter()
      .append('g')
      .append('circle')
      .attr('class', 'linecircle')
      .attr('cx', line.x())
      .attr('cy', line.y())
      .attr('r', 6)
      .on('mouseover', function() {
        d3.select(this).transition().duration(200).attr('r', 8);
      })
      .on('mouseout', function() {
        d3.select(this).transition().duration(200).attr('r', 6);
      });
    // tooltips
    var tips = container.append('g').attr('class', 'tips');
    tips.append('rect')
      .attr('class', 'tips-border')
      .attr('width', 150)
      .attr('height', 50)
      .attr('rx', 10)
      .attr('ry', 10);
      
    var wording1 = tips.append('text')
      .attr('class', 'tips-text')
      .attr('fill', 'white')
      .attr('x', 10)
      .attr('y', 20)
      .text('');
      
    var wording2 = tips.append('text')
      .attr('class', 'tips-text')
      .attr('fill', 'white')
      .attr('x', 10)
      .attr('y', 40)
      .text('');
    container
      .on('mousemove', function() {
        var m = d3.mouse(this),
          cx = m[0] - margin.left;
    
        var x0 = x.invert(cx);
        var i = (d3.bisector(function(d) {
          return d.time;
        }).left)(data, x0, 1);
    
        var d0 = data[i - 1],
          d1 = data[i] || {},
          d = x0 - d0.time > d1.time - x0 ? d1 : d0;
    
        function formatWording(d) {
          return '日期：' + d3.timeFormat("%d日%H:%M")(d.time);
        }
        wording1.text(formatWording(d));
        wording2.text('温度：' + d.tmp);
    
        var x1 = x(d.time),
          y1 = y(d.tmp);
    
        // 处理超出边界的情况
        var dx = x1 > width ? x1 - width + 200 : x1 + 200 > width ? 200 : 0;
    
        var dy = y1 > height ? y1 - height + 50 : y1 + 50 > height ? 50 : 0;
    
        x1 -= dx;
        y1 -= dy;
    
        d3.select('.tips')
          .attr('transform', 'translate(' + x1 + ',' + y1 + ')');
    
        d3.select('.tips').style('display', 'block');
      })
      .on('mouseout', function() {
        d3.select('.tips').style('display', 'none');
      });
  },
  },

  // 生活指数
  lifestyle: {
    el: `
      
    `,
    template: `
      <li class="pd-10">
        <p>{{type}}</p>
        <p class="op-5">{{brf}}</dd>
      </li>
    `,
    data: {
      lifestyle: [],
      type: {
        'comf': '舒适度指数',
        'cw': '洗车指数',
        'drsg': '穿衣指数',
        'flu': "感冒指数",
        'sport': '运动指数',
        'trav': '旅游指数',
        'uv': '紫外线指数',
        'air': '空气污染扩散条件指数'
      },
    },
    target: document.createElement('div'),
    render() {
      this.target.innerHTML = `
        <div class="wrap">
          <h3 class="bt-1">生活指数</h3>
          <ul class="flex-container lifestyle">
          </ul>
        </div>
      `
      var self = this
      self.data.lifestyle.forEach( i => {
        var a = {}
        a.type = self.data.type[i.type]
        a.brf = i.brf
        self.target.querySelector('.lifestyle').innerHTML += templateReplace(self.template, a)
      })
    },
  },
  // 城市
  allCitys: {
    el: '.container',
    template: `
      <p><a href="#/{{enName}}">{{name}}</a></p>
    `,
    data: {
      citys: []
    },
    render() {
      layout.changetoPlace()
      var self = this
      this.data.citys.forEach(  function(c) {
        c.enName = pinyinUtil.getPinyin(c.name).replace(/\s+/g, '')
        sel(self.el).innerHTML += templateReplace(self.template, c)
         // 注册路由
        log('city en name: ', c.enName)
        Router.route('/' + c.enName, async function() {
          if(c.level === 'city') {
            _main(c.center)
          } else {
            var citys = await getCity(c.name)
            log('findmycity', citys)
            model.allCitys.data.citys = citys
          }
        })
      })
     }
  },
}
