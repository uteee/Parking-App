import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaViewComponent } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { AntDesign, Entypo, Feather } from '@expo/vector-icons'; 
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { XMLParser } from 'fast-xml-parser';
import { decode } from 'html-entities';
import { getDistance } from 'geolib';
import { Toast } from 'react-native-toast-message/lib/src/Toast';
import Tts from 'react-native-tts';

import { staticParkingGarageData } from './StaticParkingGarageData';

import FavoriteStar from './FavoriteStar';
import Trend from './Trend';
import OpenClosed from './OpenClosed';

  const staticKeys = ['ACCstatic', 'Altstadtgaragestatic', 'Am Ziegeltorstatic', 'Kinostatic', 'Kräuterwiesestatic', 
                      'Kurfürstengaragestatic', 'Kurfürstenbadstatic', 'Marienstraßestatic', 'Theatergaragestatic'];

export default function App() {
  
  const[tts, setTts]                    = useState(false);
  const[showFavorite, setShowFavorite]  = useState(false);  
  const[favList, setFavList]            = useState([]);
  const[showInfo, setShowInfo]          = useState(false);
  const[infoD, setInfoD ]               = useState([]);
  const[infoS, setInfoS]                = useState([]);
  const[location, setLocation]          = useState(null);  
  
  //From https://docs.expo.dev/versions/latest/sdk/location/ to allow reading geolocation information
  //Gets location every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      (async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return;
        }
  
        let location = await Location.getCurrentPositionAsync({});
        setLocation(location)
        checkDistance(location.coords.latitude, location.coords.longitude)
      })();
    }, 5000);
    return () => clearInterval(interval);
  });

  //Check the distance from the current position to the parkinggarages. If you are less then 200 meters away a toast shows up
  //or tts informs you about the parkinggarage nearby
  const checkDistance = async (lat, long) => {
    try {
      await AsyncStorage.multiGet(staticKeys).then(key => {
        key.forEach(data => {
          const value = JSON.parse(data[1])

          const distance = getDistance({latitude: value.latitude, longitude: value.longitude},{latitude: lat, longitude:long})
          if (distance <= 200){
            if (tts){
              const name = JSON.stringify(value.name)
              const instruction = JSON.stringify(value.instruction)
              Tts.speak('In ihrere Nähe befinder sich: ' + name + instruction);
            }
            else {
              Toast.show({
                type: 'info',
                text1: 'In Ihrer Nähe befindet sich: ' + value.name,
                text2: value.instruction,
                autoHide: true,
                visibilityTime: 2000
              });
            }
          }
        });
      })
    }
    catch(e) {
      console.log(e)
    }
  }

  //Fetch xml data and save it with async storage
  const storeDynamicData = () => {
    fetch("https://parken.amberg.de/wp-content/uploads/pls/pls.xml")
    .then((response) => response.text())
    .then(async (text) => {
      const parser = new XMLParser();
      const xml    = parser.parse(text);    
      //console.log(xml)

      for (let parkhaus of xml.Daten.Parkhaus){
        parkhaus.Name   = decode(parkhaus.Name,   { level: "xml" });
        parkhaus.Status = decode(parkhaus.Status, { level: "xml" });

        await AsyncStorage.setItem(parkhaus.Name+"dynamic", JSON.stringify(parkhaus))
      }
    }) 
    .catch(() => console.log("Error fetching data."))
  }

  //Store static data from StaticParkingGarageData.js with async storage
  //(Just in case something dosen´t work the first time loading the app: Comment out the if, load it and add the line back in)
  const storeStaticData = async() => {
    try {
      const value = await AsyncStorage.multiGet(staticKeys)
      if (value[1][1] === null) {
          staticParkingGarageData.map((data) => (
          storeData(data.name, data)
        ))
      }
    }
    catch(e) {
      console.log(e)
    }
  }   

  const storeData = async (key, value) => {
    try {
      const jsonValue = JSON.stringify(value)
      await AsyncStorage.setItem(key+'static', jsonValue)
    } 
    catch(e) {
      console.log("Error storing data.")
    }
  }

  //Get information of a parkinggarage when marker on map is pressed
  const getParkingGarageInfo = async (key) => {
    try {
      const value = await AsyncStorage.getItem(key+'dynamic')
      if( value !== null) {
        setInfoD(JSON.parse(value))
      }
    }
    catch(e){
      console.log(e)
    }

    try {
      const value = await AsyncStorage.getItem(key+'static')
      if( value !== null) {
        setInfoS(JSON.parse(value))
      }
    }
    catch(e){
      console.log(e)
    }
    setShowInfo(true)
  }

  //Gets all parkinggarages with static information when clicked on the star-button
  const getFavorites = async () => {
    try {
      const dataarr = []
      await AsyncStorage.multiGet(staticKeys).then(key => {
        
        key.forEach(data => {
          dataarr.push(JSON.parse(data[1]))
        });
        setFavList(dataarr)  
    })
    }
    catch(e) {
      console.log(e)
    }
    setShowFavorite(true)
  }

  //Updates value of favorite when a parkinggarage gets added or removed
  const updateFavorite = async (key, oldFavVal) => {
    try {
      if ( oldFavVal  === 1 ){
        await AsyncStorage.mergeItem(key, JSON.stringify({favorite: 0}))
      }
      else {
        await AsyncStorage.mergeItem(key, JSON.stringify({favorite: 1}))
      }
    }
    catch(e) {
      console.log("Error updating favorite.")
    }
    getFavorites()
  }

  //Functions for testing
  const clear = async () => {
    await AsyncStorage.clear()
  }

  //Fetches dynamic data when app loads and stores static data if it´s not already in the database
  useEffect(() => {
    storeDynamicData();
    storeStaticData();
    //clear()
  })

  return (
    <View style={styles.containerView}>
      <StatusBar hidden={true} />
      <MapView style={styles.mapView} 
        showsUserLocation={true}
        initialRegion={{
          latitude: 49.4454211,
          longitude: 11.858728,
          latitudeDelta: 0.0432,
          longitudeDelta: 0.01411         
      }}>
      {staticParkingGarageData.map((marker, key) =>(
        <Marker
          key={key}
          coordinate={{latitude: marker.latitude, longitude: marker.longitude}}
          title={marker.name}
          onPress={() => {getParkingGarageInfo(marker.name)}}
        />
      ))}
      </MapView>
      <View style={styles.mapbuttonview}>
        <TouchableOpacity onPress={() => {storeDynamicData()}}>
          <Text style={styles.symbol}>
            <Feather name="refresh-ccw" size={24} color="black" />
          </Text>
        </TouchableOpacity>
        <TouchableOpacity>          
          {tts === false ? (
            <Text style={styles.symbol} onPress={() => {setTts(true)}}>
              <Entypo name="sound-mute" size={24} color="black" />
            </Text>
          ) : (
            <Text style={styles.symbol} onPress={() => {setTts(false)}}> 
              <Entypo name="sound" size={24} color="black"/> 
            </Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {getFavorites()}}>
          <Text style={styles.symbol} >
            <AntDesign name="star" size={30} color="black" />
          </Text>
        </TouchableOpacity>
      </View>
      {showInfo ? (
        <View style={styles.infoView}>
          <View style={styles.infofavViewRow}>
            <View style={styles.infofavViewHeaderLeft}>
              <Text style={styles.infofavViewHeaderText}>{infoD.Name}</Text> 
            </View>
            <View styles={styles.infofavViewHeaderRight}>
              <AntDesign style={styles.infofavViewClose} name="closecircleo" size={30} color="black" onPress={() => {setShowInfo(false)}}/>     
            </View>
          </View>
          <View style={styles.infofavViewRow}>
            <View style={styles.infoViewBodyLeft}>
              <OpenClosed openclosed={infoD.Geschlossen}></OpenClosed>
              <Text style={styles.infoViewBodyText}>€/h: {infoS.pricePerHour}</Text>
              <Text style={styles.infoViewBodyText}>Trend: <Trend trend={infoD.Trend}></Trend></Text>   
            </View>
            <View style={styles.infoViewBodyRight}>
              <Text style={styles.infoViewBodyText}>Frei: {infoD.Frei} </Text>   
              <Text style={styles.infoViewBodyText}>Belegt: {infoD.Aktuell} </Text>   
              <Text style={styles.infoViewBodyText}>Gesamt: {infoD.Gesamt} </Text>       
            </View>      
          </View>       
        </View>
      ) : null}
      {showFavorite ? (
        <View style={styles.favView}>
          <View style={styles.infofavViewRow}>
            <View style={styles.infofavViewHeaderLeft}>
              <Text style={styles.infofavViewHeaderText}>Favoriten:</Text>
            </View>
            <View styles={styles.infofavViewHeaderRight}>
              <AntDesign style={styles.infofavViewClose} name="closecircleo" size={30} color="black" onPress={() => {setShowFavorite(false), setFavList([])}}/>
            </View> 
          </View>        
          {favList.map((item, key) =>(
            <View style={styles.infofavViewRow} key={"View1"+key}>
              <Text style={styles.favViewBodyLeft}>
                {item.name}
              </Text>
              <TouchableOpacity style={styles.favViewBodyRight} key={key} onPress={() => updateFavorite(item.name+'static', item.favorite)}>
                <FavoriteStar fav={item.favorite}></FavoriteStar>
              </TouchableOpacity> 
            </View>
          ))} 
          </View> 
      ) : null} 
      <Toast></Toast>           
    </View>    
  );
};

const styles = StyleSheet.create({
  containerView: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapView: {
    width: '100%',
    height: '100%',
  },
  infoView:{
    zIndex: 2,
    paddingBottom: '40%',
    alignSelf: 'flex-start',
    width: '100%'
  },
  favView: {
    zIndex: 2,
    paddingBottom: '100%',
    alignSelf: 'flex-start',
    width: '100%'
  },
  infofavViewRow:{
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  infofavViewHeaderLeft:{
    flex: 0.95
  },
  infofavViewHeaderText: {
    fontSize: 25,
    fontWeight: 'bold',
    padding: 7
  },
  infofavViewHeaderRight:{
    flex: 0.05,
  },
  infofavViewClose: {
    padding: 10,
  },
  favViewBodyLeft: {
    flex: 0.6,
    paddingLeft: 10,
    fontSize: 22,
  },
  favViewBodyRight: {
    flex: 0.4,
    paddingTop: 2
  },
  infoViewBodyLeft:{
    flex: 0.4,
  },
  infoViewBodyRight: {
    flex: 0.6
  },
  infoViewBodyText: {
    paddingLeft: 10,
    fontSize: 20
  },
  mapbuttonview:{
    position: 'absolute',
    alignSelf: 'flex-start',
    top: '0%',
    paddingTop: 20,
    paddingLeft: 10
  },
  symbol: {
    flex: 0.2,
    padding: 10,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: 'black',
    borderRadius: 10,
    alignContent: 'center'
  },
});
