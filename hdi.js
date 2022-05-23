
/*************************/
/* CONSTANTS AND GLOBALS */
/*************************/
 
/* for maps */
const width = window.innerWidth * 0.9;
const height = window.innerHeight * 0.7;
const margin = { top: 20, bottom: 50, left: 60, right: 40 };

/* for bar chart */
 const barMargin = {
  top: 20,
  right: 25,
  bottom: 25,
  left: 180
};
const barWidth = window.innerWidth * 0.6;
const barHeight = 2000 - barMargin.top - barMargin.bottom;
 
let svgMapHDI,
    svgMapHDIGII,
    svgMapHDIinternet,
    svgMapGII,
    svgMapInternet,
    svgBar,
    hoverBox,
    hoverHDIGII,
    hoverHDIinternet,
    hoverGII,
    hoverInternet


/*********************/
/* APPLICATION STATE */
/*********************/
let country = {
 geojson: [],
 HDI: [],
};


/**
* LOAD DATA
* Using a Promise.all([]), we can load more than one dataset at a time
* */
Promise.all([
    d3.json("data/world.geo.json"), // data soure: https://geojson-maps.ash.ms/
    d3.csv("data/HDI_2019.csv")
    ]).then(([geojson, HDI]) => {
    country.geojson = geojson
    country.HDI = HDI
    console.log(country);
    init();
});

/***************************************************************************/
/************************* INITIALIZING FUNCTION ***************************/
/***************************************************************************/

 function init() {
 
 /*********************************************************************/
 /*************************** LOOKUP TABLES ***************************/ 
 /*********************************************************************/
 
  const HDILookup = new Map(country.HDI.map(d => [
    d['Country'], d['HDI']
  ]))

  const HDIRankLookup = new Map(country.HDI.map(d => [
      d['Country'], d['HDI_rank']
    ]))
  
  const GIILookup = new Map(country.HDI.map(d => [
      d['Country'], d['GII']
    ]))

  const internetLookup = new Map(country.HDI.map(d => [
      d['Country'], d['internet_users']
    ]))


  
    
 /*********************************************************************/
 /****************************** SCALES *******************************/
 /*********************************************************************/

  /* For maps */
  const colorScaleHDI = d3.scaleSequential()
      .interpolator(d3.interpolateViridis)
      // interpolateSpectral |  interpolateRdYlGn | interpolatePiYG | interpolatePRGn
      .domain(d3.extent(country.HDI.map(d => d['HDI'])))

  const colorScaleGII = d3.scaleSequential()
      .interpolator(d3.interpolateViridis)
      // interpolateSpectral |  interpolateRdYlGn | interpolatePiYG | interpolatePRGn
      .domain(d3.extent(country.HDI.map(d => d['GII'])))

  const colorScaleInternet = d3.scaleQuantile()
      .domain(country.HDI.map(d => d['internet_users']))
      // Viridis color palette array found on: https://observablehq.com/@philippkoytek/color-interpolations
      .range(["#440154", "#472c7a", "#3b528b", "#2c738e", "#26838f", "#2aa483", "#56c068", "#81d34d", "#d5e228", "#fee825"])

    /* For bar chart */
  const xScale = d3.scaleLinear()
      .domain([0, d3.max(country.HDI, d => d.HDI)])
      .range([0, barWidth])
      .nice()

      console.log("Max HDI score: ", d3.max(country.HDI, d => d.HDI))
  
  const yScale = d3.scaleBand()
      .domain(country.HDI.map(d => d.Country))
      .range([barHeight - barMargin.bottom, barMargin.top])
      .padding(.3)

      
 /*********************************************************************/
 /*************************** COLOR LEGENDS ***************************/
 /*********************************************************************/

  const colorLegendHDI = d3.legendColor()
      .scale(colorScaleHDI)
      .cells(10);

  const colorLegendGII = d3.legendColor()
      .scale(colorScaleGII)
      .cells(10);

  const colorLegendInternet = d3.legendColor()
      .scale(colorScaleInternet)
      .cells(10);




/*********************************************************************/
/******************************* MAPS ********************************/
/*********************************************************************/

/***************************************/
/**************** HDI Map **************/
  svgMapHDI = d3.select("#map")
    .append("svg")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${width} ${height}`)
    // .style("border", "solid")
    .style("background-color", "#c0f7fa")
    .style("padding-top", "1%")


  hoverBox = d3.select(".hover")

  const projection = d3.geoFahey()
    .fitSize([width, height], country.geojson)
  const pathGen = d3.geoPath().projection(projection);
  // https://github.com/d3/d3-geo-projection
  // d3.geoNaturalEarth1() ***
  // d3.geoEckert1()
  // d3.geoEckert3()
  // d3.geoBromley() ***
  // d3.geoFahey() ***
  // d3.geoNellHammer() ***
  // d3.geoRobinson() ***
  // d3.geoWagner6() ***


  const countries = svgMapHDI.selectAll("path.country")
    .data(country.geojson.features)
    .join("path")
    .attr("class", "country")
    .attr("d", d => pathGen(d))
    .attr("stroke","white")
    .attr("fill", (d, i) => {
        return colorScaleHDI(+HDILookup.get(d.properties.name))
    })
    .on("mouseover", mouseOver)
    .on("click", (ev, d) => {
      console.log('d :>> ', d);
      country.hover_country = d.properties.name;
      country.hover_HDI_rank = HDIRankLookup.get(d.properties.name)
      country.hover_HDI = HDILookup.get(d.properties.name)
      mouseClick();
    })
    .on("mouseout", mouseOut)
    
  svgMapHDI.append("text")
    .attr("transform", `translate(${width - margin.right * 5}, 20)`)
    // .style("text-anchor", "middle")
    .text("Human Development Index"); 

  svgMapHDI.append("g")
    .call(colorLegendHDI)
    .attr("transform", `translate(${width - margin.right * 2}, 30)`)




/**********************************************/
/**********************************************/
/************* INTERNET USERS MAP *************/

  svgMapInternet = d3.select("#internet-map")
  .append("svg")
  .attr("preserveAspectRatio", "xMinYMin meet")
  .attr("viewBox", `0 0 ${width} ${height}`)
  // .style("border", "solid")
  .style("background-color", "#c0f7fa")
  .style("padding-top", "1%")

  hoverInternet = d3.select(".internet-hover")

  const projectionInternet = d3.geoFahey()
  .fitSize([width, (height * 0.95)], country.geojson)
  const pathGenInternet = d3.geoPath().projection(projectionInternet);

  const countriesInternet = svgMapInternet.selectAll("path.country")
  .data(country.geojson.features)
  .join("path")
  .attr("class", "country")
  .attr("d", d => pathGenInternet(d))
  .attr("stroke","white")
  .attr("fill", (d, i) => {
    return colorScaleInternet(+internetLookup.get(d.properties.name))
  })
  .on("mouseover", mouseOver)
  .on("click", (ev, d) => {
  console.log('d :>> ', d);
    country.hover_internet_country = d.properties.name;
    country.hover_internet = internetLookup.get(d.properties.name)
    country.hover_internet_HDI = HDIRankLookup.get(d.properties.name)
    mouseClickInternet();
  })
  .on("mouseout", mouseOutInternet)


  svgMapInternet.append("text")
  .attr("transform", `translate(${width - margin.right * 5.2}, 20)`)
  // .style("text-anchor", "middle")
  .text("Internet Users (% of population)"); 

  svgMapInternet.append("g")
  .call(colorLegendInternet)
  .attr("transform", `translate(${width - margin.right * 3}, 30)`)



/*******************************************************/
/*******************************************************/
/************* GENDER INEQUALITY INDEX MAP *************/
  
  svgMapGII = d3.select("#GII-map")
      .append("svg")
      .attr("preserveAspectRatio", "xMinYMin meet")
      .attr("viewBox", `0 0 ${width} ${height}`)
      // .style("border", "solid")
      .style("background-color", "#c0f7fa")
      .style("padding-top", "1%")

  hoverGII = d3.select(".GII-hover")

  const projectionGII = d3.geoFahey()
      .fitSize([width, (height * 0.95)], country.geojson)
  const pathGenGII = d3.geoPath().projection(projectionGII);

  const countriesGII = svgMapGII.selectAll("path.country")
      .data(country.geojson.features)
      .join("path")
      .attr("class", "country")
      .attr("d", d => pathGenGII(d))
      .attr("stroke","white")
      .attr("fill", (d, i) => {
        return colorScaleGII(+GIILookup.get(d.properties.name))
      })
      .on("mouseover", mouseOver)
      .on("click", (ev, d) => {
      console.log('d :>> ', d);
        country.hover_GII_country = d.properties.name;
        country.hover_GII = GIILookup.get(d.properties.name)
        country.hover_GII_HDI = HDILookup.get(d.properties.name)
        mouseClickGII();
      })
      .on("mouseout", mouseOutGII)

  svgMapGII.append("text")
  .attr("transform", `translate(${width - margin.right * 5}, 20)`)
  // .style("text-anchor", "middle")
  .text("Gender Inequality Index"); 

  svgMapGII.append("g")
      .call(colorLegendGII)
      .attr("transform", `translate(${width - margin.right * 2}, 30)`)



/************************************************************************/
/************************ MOUSE EVENTS FUNCTIONS ************************/ 
/************************************************************************/

/*********** mouseOver function ***********/ 
/*********** Works for all maps ***********/
/******************************************/

  function mouseOver() {
    d3.select(this)
    .attr("stroke", "#fc4e9a")//#f590c4
    .attr("stroke-width", "4px")
  }


/**************** HDI Map against bar chart ************/
/*******************************************************/

  function mouseClick() {
    hoverBox
    .style("visibility", "visible")
    .html(
      `<div class="hover_container">
      <div>Country: ${country.hover_country}</div>
      <div>Human Development Index: ${country.hover_HDI}</div>
      <div>World HDI rank: ${country.hover_HDI_rank} out of 189</div>
      </div>`
    )
  }

  function mouseOut(){
    d3.select(this)
    .attr("stroke", "white")
    .attr("stroke-width", "1px")
  hoverBox
    .style("visibility", "hidden")
  }



/******************* Internet Users Map *******************/
/**********************************************************/

  function mouseClickInternet() {
    hoverInternet
    .style("visibility", "visible")
    .html(
      `<div class="hover_container">
      <div>Country: ${country.hover_internet_country}</div>
      <div>Internet Users: ${country.hover_internet} % of population</div>
      <div>World HDI rank: ${country.hover_internet_HDI} out of 189</div>
      </div>`
    )
  }

  function mouseOutInternet(){
    d3.select(this)
    .attr("stroke", "white")
    .attr("stroke-width", "1px")
    hoverInternet
    .style("visibility", "hidden")
  }

/**************** Gender Inequality Index Map ****************/
/*************************************************************/

  function mouseClickGII() {
    hoverGII
    .style("visibility", "visible")
    .html(
      `<div class="hover_container">
     <div>Country: ${country.hover_GII_country}</div>
      <div>Gender Inequality Index: ${country.hover_GII}</div>
      <div>Human Development Index: ${country.hover_GII_HDI}</div>
      </div>`
    )
  }

  function mouseOutGII(){
    d3.select(this)
    .attr("stroke", "white")
    .attr("stroke-width", "1px")
    hoverGII
    .style("visibility", "hidden")
  }






}
