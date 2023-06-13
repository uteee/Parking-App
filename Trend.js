import { Text } from 'react-native';
import { AntDesign } from '@expo/vector-icons'; 

//This function returns an arrow depending on the trend of the parkinggarage
export default function Trend(props){
  return(
    <Text>
      {props.trend === 1 ? (
        <AntDesign name="caretup" size={24} color="red" />
      ) : props.trend === 0 ? (
        <AntDesign name="caretright" size={24} color="black" />
      ) : (
        <AntDesign name="caretdown" size={24} color="green" />
      )}
    </Text>
  )
}