require([
    "esri/config",
    "esri/Map",
    "esri/views/MapView",
    "esri/Basemap",
    "esri/layers/VectorTileLayer",
    "esri/layers/TileLayer",
    "esri/geometry/Point",
    "esri/layers/FeatureLayer",
    "esri/widgets/Locate",
    "esri/widgets/Track",
    "esri/Graphic",
    "esri/layers/ElevationLayer",
    "esri/widgets/ElevationProfile",
    "esri/widgets/BasemapGallery",
    "esri/widgets/LayerList",
    "esri/layers/ImageryTileLayer"


], function (
    esriConfig,
    Map,
    MapView,
    Basemap,
    VectorTileLayer,
    TileLayer,
    Point,
    FeatureLayer,
    Locate,
    Track,
    Graphic,
    ElevationLayer,
    ElevationProfile,
    BasemapGallery,
    LayerList,
    ImageryTileLayer
) {

    esriConfig.apiKey = "AAPKb52b6b0996a64f1aba15e1cc3692a30csRR3uKi-EUHXYBX26a9KGP4zGt0GoZmGic1rgHu78Ee9VxbEtUrJEPd-vrQPRWPz";

    const topoLayer = new VectorTileLayer({
        portalItem: {
            id: "734c12e9904b4a8086d2dff8582a93a1" //NZ topographic layer
        },
    });
    const hillshadeLayer = new TileLayer({
        portalItem: {
            id: "38c860f8dbd24820b2a59ccc9a3dabdb" // NZ hillshade layer
        }

    });


    const topoBasemap = new Basemap({
        baseLayers: [


            hillshadeLayer,
            topoLayer

        ],
        title: "Vector Topographic",
        id:"vectortopographicbasemap"
    });
    const linzTopoLayer = new TileLayer({
        portalItem: {
            id: "85027f060e2b47249a508ada6f44403d" // NZ LINZ Topographic
        },
    });
    const linzBasemap = new Basemap({
        baseLayers: [
            linzTopoLayer
        ],
        title: "LINZ Topographic",
        id: "linzbasemap"
    });
    const imageryLayer = new TileLayer({
        portalItem: {
            id: "d284729222d04a3cb548cfe27716ea43" // NZ imagery
        }
    });
    const imageryBasemap = new Basemap({
        baseLayers: [
            imageryLayer
        ],
        title: "Imagery",
        id: "imagerybasemap"
    });
    const popupHuts = {
        "content": "<img src={introductionThumbnail} /><br />" +
            "<h1>{name}</h1><i>{place}, {region}</i><br /><br />" +
            "<b>Facilities:</b> {facilities}<br />" +
            "<b>Status:</b> {status}<br />" +
            "<b>Bookable:</b> {bookable}<br />" +
            "<a href='{staticLink}'>More Info</a>"
    }
    const labelHuts = {
        // autocasts as new LabelClass()
        symbol: {
            type: "text", // autocasts as new TextSymbol()
            color: [43, 43, 43, 255],
            font: {
                // autocast as new Font()
                weight: "bold"
            },
            haloSize: 1,
            haloColor: "white"
        },
        labelPlacement: "below-center",
        labelExpressionInfo: {
            expression: "$feature.name"
        }
    };
    
    const DOCHuttsLayer = new FeatureLayer({
        url: "https://services1.arcgis.com/3JjYDyG3oajxU6HO/arcgis/rest/services/DOC_Huts/FeatureServer",
        outFields: ["name", "place", "facilities", "status", "bookable"],
        popupTemplate: popupHuts,
        labelingInfo: [labelHuts],
        renderer: hutsRenderer,
    });
    const TracksLayer = new FeatureLayer({
        url: "https://services1.arcgis.com/3JjYDyG3oajxU6HO/arcgis/rest/services/DOC_Tracks/FeatureServer",
        renderer: trailsRenderer
    });
    const elevationLayer = new ElevationLayer({
        portalItem: {
            id: "2ce4fe7d77024e719f8a04d2155b3fd2"
        }
    });
    const windForecast = new ImageryTileLayer({url: "https://tiledimageservices.arcgis.com/hLRlshaEMEYQG5A8/arcgis/rest/services/vector_field_layer/ImageServer", 
        title: "Wind",
        renderer: {
            type: "animated-flow", // autocasts to new AnimatedFlowRenderer
            lineWidth: "1px",
            lineColor: [50, 120, 240,0.3],
            density: 0.5
        },
        effect: "bloom(2, 0.25px, 0)"
    });

    const map = new Map({
        basemap: topoBasemap, // Basemap layer service 
        layers: [TracksLayer, DOCHuttsLayer, windForecast],
        ground:{
            layers:[elevationLayer]
        }
    });

    const view = new MapView({
        map: map,
        center: new Point({ x: 1795999, y: 5457405, spatialReference: { wkid: 2193 } }), // nztm coordinates
        zoom: 10, // Zoom level
        container: "viewDiv", // Div element
        padding: {
            left: 49,
          },
    });
    const locate = new Locate({
        view: view,
        useHeadingEnabled: false,
        goToOverride: function(view, options) {
          options.target.scale = 1500;
          return view.goTo(options.target);
        }
    });
    const track = new Track({
        view: view,
        graphic: new Graphic({
          symbol: {
            type: "simple-marker",
            size: "12px",
            color: "green",
            outline: {
              color: "#efefef",
              width: "1.5px"
            }
          }
        }),
        useHeadingEnabled: false
    });
    const elevationProfile = new ElevationProfile({
        view: view,
        profiles: [{ type: "ground" }],
        container: "profile",
    });
    
    
    const basemapGallery = new BasemapGallery({
        view: view,
        source: [topoBasemap, linzBasemap, imageryBasemap]
    });
    view.ui.add(basemapGallery, "top-right");
    view.ui.add(track, "top-left");
    view.ui.add(locate, "top-left");
    view.popup.defaultPopupTemplateEnabled = true;
    view.when(() => {
        const layerList = new LayerList({
        view: view
        });
    
        // Add widget to the top right corner of the view
        view.ui.add(layerList, "top-right");
        });
        let activeWidget;

        // here we define the code which should run when our action bar is clicked
        const handleActionBarClick = ({ target }) => {
          // make sure we are clicking on a calcite action button
          if (target.tagName !== "CALCITE-ACTION") {
            return;
          }
      
          // check if there is an active widget and if so hide it
          if (activeWidget) {
            document.querySelector(
              `[data-action-id=${activeWidget}]`
            ).active = false;
            document.querySelector(`[data-panel-id=${activeWidget}]`).hidden = true;
          }
      
          // determine which widget button was clicked. If it's the button for the currently active widget
          // then we just set the active widget to null (as we already hid it), else we hide the current widget and show the next
          const nextWidget = target.dataset.actionId;
          if (nextWidget !== activeWidget) {
            document.querySelector(`[data-action-id=${nextWidget}]`).active = true;
            document.querySelector(`[data-panel-id=${nextWidget}]`).hidden = false;
            activeWidget = nextWidget;
          } else {
            activeWidget = null;
          }
        };
        // here we actually add the code to the action bar
        document.querySelector("calcite-action-bar").addEventListener("click", handleActionBarClick);
      
});