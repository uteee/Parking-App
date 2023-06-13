import { Text } from 'react-native';
import { AntDesign } from '@expo/vector-icons'; 

//This function returns a star whose color is set wether the parking garage is a favorite of not
export default function FavoriteStar(props){
  return(
    <Text>
      {props.fav === 1 ? (
        <AntDesign name="star" size={25} color="orange"/>
      ) : (
        <AntDesign name="star" size={25} color="black"/>
      )}
    </Text>  
  )
}