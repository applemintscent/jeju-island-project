
library(shiny)
library(dplyr)
library(leaflet)
library(DT)

setwd("C:/Users/Master/Desktop")
#getwd()

ui <- navbarPage("Location of Charging Station for Electric cars", id="main",
                 tabPanel("Map", leafletOutput("bbmap", height=1000)),
                 tabPanel("Data", DT::dataTableOutput("data")),
                 tabPanel("Read Me",includeMarkdown("readme.md")))


server <- shinyServer(function(input, output) {
  
  # Import Data and clean it
  bb_data <- read.csv("jeju_data_.csv", stringsAsFactors = FALSE, fileEncoding = "euc-kr")
  bb_data <- data.frame(bb_data)
  bb_data=filter(bb_data, lat != "NA") # removing NA values
  
  # new column for the popup label
  bb_data <- mutate(bb_data, cntnt=paste0('<strong>분류:</strong> ',분류,
                                          '<br><strong>이름:</strong> ',충전소,
                                          '<br><strong>주소:</strong> ',주소,
                                          '<br><strong>운영시간:</strong> ',이용가능시간,
                                          '<br><strong>충전기 타입:</strong> ',충전기타입,
                                          '<br><strong>충전기 용량:</strong> ',충전기용량,
                                          '<br><strong>충전요금:</strong> ', 충전요금
                                          )) 
  
  # create a color paletter for category type in the data file
  pal <- colorFactor(pal = c("#1b9e77", "#d95f02"), domain = c("충전소", "AS센터"))
  
  # create the leaflet map  
  output$bbmap <- renderLeaflet({
    leaflet(bb_data) %>% 
      addCircles(lng = ~lon, lat = ~lat) %>% 
      addTiles() %>%
      addCircleMarkers(data = bb_data, lat =  ~lat, lng =~lon, 
                       radius = 5, popup = ~as.character(cntnt), 
                       color = ~pal(분류),
                       stroke = FALSE, fillOpacity = 1)%>%
      addLegend(pal=pal, values=bb_data$분류,opacity=1, na.label = "Not Available")%>%
      addEasyButton(easyButton(
        icon="fa-crosshairs", title="ME",
        onClick=JS("function(btn, map){ map.locate({setView: true}); }")))
  })
  
  #create a data object to display data
  output$data <-DT::renderDataTable(datatable(
    bb_data[,c(-1,-23,-24,-25,-28:-35)],filter = 'top',
    colnames = c("분류", "충전소", "주소", "이용가능시간", "충전기타입", "충전기용량", "lon", "lat.","충전요금")))
  
})

shinyApp(ui, server)



