// react
import React, { useState, useEffect, useRef } from 'react';

// openlayers
import KML from 'ol/format/KML'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import XYZ from 'ol/source/XYZ'
import {transform} from 'ol/proj'
import {toStringXY} from 'ol/coordinate';

function MapWrapper(props) {

  // set intial state
  const [ map, setMap ] = useState()
  const [ featuresLayer, setFeaturesLayer ] = useState()
  const [ selectedCoord , setSelectedCoord ] = useState()

  // pull refs
  const mapElement = useRef()
  
  // create state ref that can be accessed in OpenLayers onclick callback function
  //  https://stackoverflow.com/a/60643670
  const mapRef = useRef()
  mapRef.current = map

  // initialize map on first render - logic formerly put into componentDidMount
  useEffect( () => {

    // create and add vector source layer
    const initalFeaturesLayer = new VectorLayer({
      source: new VectorSource({
        url: '.../data/kml/2012-02-10.kml',
        format: new KML(),
      })
    })

    // create map
    const initialMap = new Map({
      target: mapElement.current,
      layers: [
        
        // USGS Topo
        new TileLayer({
          source: new XYZ({
            url: 'https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=2KEto51zpti720ZQd9Kb',
          })
        }),

        // Google Maps Terrain
        // new TileLayer({
        //   source: new XYZ({
        //     url: 'http://mt0.google.com/vt/lyrs=p&hl=en&x={x}&y={y}&z={z}',
        //   })
        // }), 

        initalFeaturesLayer
        
      ],
      view: new View({
        projection: 'EPSG:3857',
        center: [876970.8463461736, 5859807.853963373],
        zoom: 10
      }),
      controls: []
    })

    // set map onclick handler
    initialMap.on('click', handleMapClick)
  

    // set map pointer move handler
    initialMap.on('pointermove', function (evt) {
      if (evt.dragging) {
        return;
      }
      const pixel = mapRef.current.getEventPixel(evt.originalEvent);
      displayFeatureInfo(pixel);
    });


    // save map and vector layer references to state
    setMap(initialMap)
    setFeaturesLayer(initalFeaturesLayer)

  },[])

  // update map if features prop changes - logic formerly put into componentDidUpdate
  useEffect( () => {

    if (props.features.length) { // may be null on first render

      // set features to map
      featuresLayer.setSource(
        new VectorSource({
          features: props.features // make sure features is an array
        })
      )

      // fit map to feature extent (with 100px of padding)
      map.getView().fit(featuresLayer.getSource().getExtent(), {
        padding: [100,100,100,100]
      })

    }

  },[props.features])

  // map click handler
  const handleMapClick = (event) => {
    
    // get clicked coordinate using mapRef to access current React state inside OpenLayers callback
    //  https://stackoverflow.com/a/60643670
    const clickedCoord = mapRef.current.getCoordinateFromPixel(event.pixel);

    // transform coord to EPSG 4326 standard Lat Long
    const transormedCoord = transform(clickedCoord, 'EPSG:3857', 'EPSG:4326')

    // set React state
    setSelectedCoord( transormedCoord )
    
  }
  


  // map pointermove handler
  const displayFeatureInfo = function (pixel) {
    const features = [];
    mapRef.current.forEachFeatureAtPixel(pixel, function (feature) {
      features.push(feature);
    });
    if (features.length > 0) {
      const info = [];
      let i, ii;
      for (i = 0, ii = features.length; i < ii; ++i) {
        info.push(features[i].get('name'));
      }
      document.getElementById('info').innerHTML = info.join(', ') || '(unknown)';
      mapRef.current.getTarget().style.cursor = 'pointer';
    } else {
      document.getElementById('info').innerHTML = '&nbsp;';
      mapRef.current.getTarget().style.cursor = '';
    }
  };

  // render component
  return (      
    <div height="50px">
      
      <div  height="50px" ref={mapElement} className="map-container"></div>
      
      <div className="clicked-coord-label">
        <p>{ (selectedCoord) ? toStringXY(selectedCoord, 5) : '' }</p>
      </div>

      <div id="info">&nbsp;</div>

    </div>
  ) 

}

export default MapWrapper