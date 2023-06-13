import { Text, StyleSheet } from 'react-native';

//This function returns a text wether the parkinggarage is opend or closed
export default function OpenClosed(props){
  return(
    <Text style={styles.text}>
      {props.openclosed === 0 ? (
        <Text>Offen</Text>
      ) : (
        <Text> Geschlossen</Text>
      )}
    </Text>  
  )
}

const styles = StyleSheet.create({
  text: {
    paddingLeft: 10,
    fontSize: 20
  }
})