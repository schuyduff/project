
#include <math.h>
#include "SparkJson.h"
#include "Sunrise.h"

//=================================================BEGIN SDFAT SETUP
#include "SdFat.h"
// Pick an SPI configuration.
// See SPI configuration section below (comments are for photon).
#define SPI_CONFIGURATION 0
//------------------------------------------------------------------------------
// Setup SPI configuration.
#if SPI_CONFIGURATION == 0
// Primary SPI with DMA
// SCK => A3, MISO => A4, MOSI => A5, SS => A2 (default)
SdFat sd;
const uint8_t chipSelect = SS;
#elif SPI_CONFIGURATION == 1
// Secondary SPI with DMA
// SCK => D4, MISO => D3, MOSI => D2, SS => D1
SdFat sd(1);
const uint8_t chipSelect = D1;
#elif SPI_CONFIGURATION == 2
// Primary SPI with Arduino SPI library style byte I/O.
// SCK => A3, MISO => A4, MOSI => A5, SS => A2 (default)
SdFatLibSpi sd;
const uint8_t chipSelect = SS;
#elif SPI_CONFIGURATION == 3
// Software SPI.  Use any digital pins.
// MISO => D5, MOSI => D6, SCK => D7, SS => D0
SdFatSoftSpi<D5, D6, D7> sd;
const uint8_t chipSelect = D0;
#endif  // SPI_CONFIGURATION
//------------------------------------------------------------------------------
File myFile;
//=================================================END SDFAT SETUP


TCPClient client;

enum {
      START,
      STATE_SOCKET,
      STATE_READ_SOCKET,
      STATE_WRITE_SOCKET,
      STATE_CONNECT,
      STATE_WRITE,
      STATE_DISCONNECT,
      SDFAT_WRITE,
      SDFAT_READ
      };

int state = START;
//==============================================================CUSTOM VARIABLES
//=============================================================READ VARIABLES
char inChar[2000];
int j = 0;
bool record = false;
//======INDEX FOR INCOMING PACKETS
int num = 1;
//==================================================TIME CLOCK CONTROL VARIABLES
bool timeClockOn = false;
unsigned int timeClockStart = 7*3600000;
unsigned int timeClockFinish = 23*3600000;
//======================================================================DLI RESET
float DLItarget = 17.0;
// DLI COUNTER
float DLI_counter = 0.0;
unsigned long check_date = 1111111111;
//=================================================================MISC VARIABLES
int rule_flag = 0;
//====================================================PROGRAM START SECONDS
unsigned int seconds_start = 0;
unsigned int second_counter = 0;
float filtered_signal_previous = 0.0;

//===========================================================TRANSMISSION VARS
char server[] = "ec2-54-245-208-76.us-west-2.compute.amazonaws.com";
int port = 8080;
String myRandWebSocket = String(rand()*10000+10000); //attempt at random security
char buffer[4000];
char SdFatBuffer[4000];
bool init = true;
bool once = true;
bool SdFatOnce = true;
//============================================================PWM CONTROL SIGNAL
const int PWM_control_pin = D0;
const int PWM_enable_pin_5v = D2;
const int PWM_enable_pin_mode = D3;
const int PWM_control_pin_2 = A6;
const int licor_sensor_pin = A1;

void setup() {
  pinMode(PWM_control_pin, OUTPUT);
  pinMode(PWM_control_pin_2, OUTPUT);

  pinMode(PWM_enable_pin_5v, OUTPUT);
  digitalWrite(PWM_enable_pin_5v, HIGH);
  pinMode(PWM_enable_pin_mode, OUTPUT);
  digitalWrite(PWM_enable_pin_mode, HIGH);
  filtered_signal_previous = licor_sensor_PPFD();

  Serial.begin(9600);
  Time.zone(0);
  // initialize transmission JSON
  seconds_start = Time.local();
  second_counter = Time.now();
//=============================================SETUP SDFAT
  if (!sd.begin(chipSelect, SPI_HALF_SPEED)) {
    Serial.println("Initialization of SdFat failed. Stopping...");
    sd.initErrorHalt();
  }
}

void GET_SOCKET(char route[]){

  client.write("GET "+String(route)+" HTTP/1.1\r\n");
  client.write("Host: "+String(server)+"\r\n");
  client.write("Upgrade: websocket\r\n");
  client.write("Connection: Upgrade\r\n");
  client.write("Sec-WebSocket-Key: "+String(myRandWebSocket)+"==\r\n");
  client.write("Origin: photon\r\n");
  client.write("Sec-WebSocket-Version: 13\r\n");
  client.write("\r\n");

}

void POST_SOCKET(){

  uint8_t len = strlen(buffer);
  int frameLength = 2;
  byte first = byte(129);
  byte second = byte(len);
  byte third = byte((len >> 8) & 255);
  byte fourth = byte(len & 255);

  if (len > 125){
    second = byte(126);
    frameLength = 4;
  }

  byte frame[frameLength];
  frame[0] = first;
  frame[1] = second;

  if (len > 125){
    frame[2] = third;
    frame[3] = fourth;
  }

  client.write(frame,frameLength);
  int written = client.write(buffer);
  buff_reset();


}
void _read(){

  //  Serial.println("client available");
  char c = client.read();
  Serial.print(c);
  if (c == '[') {record = true; }

  if (record){
    inChar[j] = c;
    j++;
//    if (c == ']') {record = false; }
  }
}

void _read_reset(){
  //=====================================================REINITIALIZE READ VARIABLES
  j=0;
  record = false;
  for (int k = 0; k<sizeof(inChar); k++){
    inChar[k]='\0';
  };
}

void buff_reset(){

  for (int k = 0; k<sizeof(buffer); k++){
    buffer[k]='\0';
  };
}

void SdFat_reset(){

  for (int k = 0; k<sizeof(SdFatBuffer); k++){
    SdFatBuffer[k]='\0';
  };

}

//================================================================LOOP
void loop(){

  switch(state) {
//=========================================================DISCONNECT
      case STATE_DISCONNECT:
        client.stop();
        for(;;);
      break;

//====================================================SDFAT_WRITE
      case SDFAT_WRITE:
        SdFatWrite("testing 1, 2, 3.");
        state = SDFAT_READ;
      break;

//============================================================SDFAT_READ
      case SDFAT_READ:
        SdFatRead();
        for(;;);
      break;

//================================================================START
      case START:
        while(!Serial.available()) Particle.process();
        state = STATE_SOCKET;
      break;

//======================================================SOCKET CONNECT
      case STATE_SOCKET:


        Serial.println();
        Serial.println("STATE: SOCKET_CONNECT");

        if (client.connect(server, port)){

          Serial.println();
          Serial.println("GET SOCKET");

        //  char route[] = "/api/firmware/socket";
          GET_SOCKET("/api/firmware/socket");

          state = STATE_READ_SOCKET;

        } else {

          Serial.println("ERROR! Failed to connect! Retry...");

        }

      break;

//===========================================================READ SOCKET
      case STATE_READ_SOCKET:

        if (!client.connected()){
          Serial.println();
          Serial.println("STATE: READ SOCKET -- Client Disconnected!");
          state = STATE_SOCKET;
          init = true;

        } else {

          if (client.available()){

            Serial.println();
            Serial.println("STATE: READ SOCKET -- Client Available");


            while(client.available()){
              _read();
            }

            client.flush();

          }

          state = STATE_WRITE_SOCKET;

        }

      break;
//=======================================================STATE WRITE SOCKET
      case STATE_WRITE_SOCKET:

        if (strlen(inChar)>0){

          Serial.println();
          Serial.println();
          Serial.println("STATE: WRITE SOCKET -- WRAPPER -- SDFATWRITE -- POST --");
          Serial.println();

          wrapper_socket();
          if (SdFatOnce){
            //==============skip duplicate write to SdFat on init
            SdFatOnce = false;
          } else {
            SdFatWrite(SdFatBuffer);
          }
          //SdFatRead();
          POST_SOCKET();
          _read_reset();

        } else {

//===========================================================GET LAST DOC IN DATABASE or create first entry
          if (init){
            init = false;
            Serial.println();
            Serial.println();
            Serial.println("STATE: WRITE SOCKET -- get init -- ");
            Serial.println();

            String _init = "init";
            _init.toCharArray(buffer,sizeof(buffer));
            POST_SOCKET();

          }

//=================================================if statement executes once per second
          int now = Time.now();
          if (now != second_counter){
            second_counter = now;
            unsigned int _seconds_since_start = seconds_since_start(seconds_start);

            Serial.println();
            Serial.println();
            Serial.println("STATE: WRITE SOCKET ");
            Serial.println();

            Serial.print("Seconds_since_start: ");
            Serial.println(_seconds_since_start);
          }


        }

        state = STATE_READ_SOCKET;

      break;
//=================================================================WRITE
      case STATE_WRITE:
        while(!Serial.available()) Particle.process();

        int photoperiod = 24;
        float range_max = 255.0;
        float range_min = 0.0;
        float PPFD_target = _PPFD_target(photoperiod, DLItarget);
        float PPFD_full_power = 400.0;

        float _licor_volts = licor_sensor_PPFD();
        float _filtered_signal = low_pass_filter(filtered_signal_previous, _licor_volts);
        float PPFD_actual_licor = volts_to_micromoles(_filtered_signal);

        int PWM_control = light_switch(PPFD_actual_licor, PPFD_target, PPFD_full_power, range_min, range_max);

        Serial.print("PWM Volts: ");
        Serial.println(float_map(PWM_control,range_min, range_max,0.0,3.3));

        //pinMode(PWM_control_pin_2, OUTPUT);
        //analogWrite(PWM_control_pin_2,5000);

        analogWrite(PWM_control_pin, PWM_control);

        delay(1000);
        Serial.println();
              /*
              int _seconds_flag = seconds_flag(seconds_start);
              unsigned long _timevalue = Time.now();

              LASSI(_transmit, timeClockOn, timeClockStart, timeClockFinish, _seconds_flag, _timevalue, _PPFD);
              */
        break;

      }


}
          /*
          float spark_fun_sensor_PPFD(){
          //==================================CONVERT CONTROL SIGNAL INTO LUX
          float sensor_input = analogRead(spark_fun_sensor_pin);
          //  Serial.print("spark analog read: ");
          //  Serial.println(sensor_input);
          float volts = sensor_input*3.3/4095.0;
          //  Serial.print("spark volts: ");
          //  Serial.println(volts);
          float amps = volts / 10000.0;
          float microamps = amps * 1000000.00;
          //  Serial.print("spark uAmps: ");
          //  Serial.println(microamps);
          float lux = microamps *6.66;
          //====================================CONVERT LUX TO MICROMOLES
          float umols = lux * 0.0185;
          Serial.print("spark umols: ");
          Serial.println(umols);
          return umols;
        }
        */



void wrapper_socket(){
  //    const size_t bufferSize = JSON_ARRAY_SIZE(48) + 48*JSON_OBJECT_SIZE(1) + 700;
  //    StaticJsonBuffer<bufferSize> jsonBuffer;
  //    const int bufferSize = JSON_ARRAY_SIZE(48) + 48*JSON_OBJECT_SIZE(1);
  //StaticJsonBuffer<bufferSize> jsonBuffer;
  DynamicJsonBuffer jsonBuffer;
  JsonArray& tree = jsonBuffer.parseArray(inChar);


  //tree.prettyPrintTo(Serial);
  Serial.println();

  //============================================================initialize transmit
  //============================================================BEGIN LOOP OVER PACKET OF DATA
  for (int i = 0;i<tree.size();i++){
//    Serial.println();
/*
    String l = tree[i]["L"].asString();
    char input[7];
    l.toCharArray(input,7);
    float _PPFD = atof(input);
    */

    unsigned long _timevalue = tree[i]["T"];
    Serial.print("Timevalue at read: ");
    Serial.println(_timevalue);
    _timevalue = ++_timevalue;
    //
    // float _PPFD = tree[i]["L"];
    // Serial.print("new PPFD: ");
    // Serial.println(_PPFD);
    //
    float _PPFD = simulate_daily_PPFD(_timevalue);
    Serial.print("Simulate Daily PPFD: ");
    Serial.println(_PPFD,6);

    if (once){
//==================here DLI needs to be set to the last available value; from local storage
      once = false;
      float new_DLI = tree[i]["DLI"];
      Serial.print("new DLI: ");
      Serial.println(new_DLI);
      DLI_counter = new_DLI;

    }

    LASSI_socket(tree, timeClockOn, timeClockStart, timeClockFinish, i, _timevalue, _PPFD);

  }

  //====================================================================END FOR LOOP
  Serial.println();
  Serial.print("POST: ");
  tree.printTo(Serial);
  Serial.println();
  Serial.print("Array Size: ");
  Serial.println(tree.size());

  tree.printTo(buffer,sizeof(buffer));
  tree[0].printTo(SdFatBuffer,sizeof(SdFatBuffer));

  //    Serial.print("DLI: ");
  //    Serial.println(DLI_counter);

}


//==================================================================LASSI
void LASSI_socket(JsonArray& _packet, bool timeClockOn, int timeClockStart, int timeClockFinish, int i, unsigned long timevalue, float PPFD){

  int millisecondsOn = 0;
  float PPFD_650e = 1100.0;
  float PPFD_adjusted = 0.0;

//  Serial.print("PPFD: ");
//  Serial.println(PPFD);

  if (algorithm_socket(timevalue, PPFD, timeClockOn, timeClockStart, timeClockFinish)){
    //Serial.println(Time.hour(timevalue));
    Serial.println("Lights off");
    DLI_counter += milliseconds_PPFD(1000,PPFD);
    PPFD_adjusted = PPFD;

  } else {

    //PPFD_adjusted = PPFD + PPFD_650e;
    PPFD_adjusted = PPFD;

    DLI_counter += milliseconds_PPFD(1000,PPFD_adjusted);

    // Serial.print("DLI from Lights: ");
    // Serial.println(milliseconds_PPFD(1000,PPFD_adjusted),6);
    Serial.print("DLI_counter_lassi: ");
    Serial.println(DLI_counter,6);

    rule_flag = 0;
    //    Serial.println(Time.hour(timevalue));
    Serial.println("Lights on");
    //    Serial.print("Light contribution: ");
    //    Serial.println(lightIntegral_650e(1800000));
  };

//  Serial.print("DLI: ");
//  Serial.println(DLI_counter);

//delay(1000);

//=====================================================transmission
build_packet_socket(_packet, i, timevalue, PPFD, PPFD_adjusted, rule_flag);

//=====================================================transmission end


// ==================================================== for loop end
}

void build_packet_socket(JsonArray& __packet, int _i, unsigned long timestamp, float PPFD, float PPFD_adjusted, int _rule_flag){


  __packet[_i]["T"] = timestamp;
  __packet[_i]["L"] = PPFD*10000;
  __packet[_i]["LL"] = PPFD_adjusted - PPFD;
  __packet[_i]["R"] = rule_flag;
  __packet[_i]["E"] = 99.0;
  __packet[_i]["D"] = 98.0;
  __packet[_i]["DLI"] = DLI_counter*10000000;

}
float simulate_daily_PPFD(unsigned long timestamp){


  unsigned long xTerm = timestamp - 1483228800;
  float sinTerm = 1.0/86400.0*3.14159;
  float _final = 2500.0 * sinf(sinTerm*(float)xTerm);

  return _final;
}
//=============================================================================LASSI RULES
bool algorithm_socket(unsigned long _timevalue, float _PPFD, bool timeClockOn, int timeClockStart, int timeClockFinish){

  bool lightOff = true;

  float latitude = 42.443961;
  float longitude = -76.501881;

  unsigned int _millisecondsInDay = 86400000;
  unsigned int _millisecondsInHour = 3600000;
  unsigned int _millisecondsInHalfHour = 1800000;
  unsigned int _millisecondsInSecond = 1000;
  unsigned int _offpeakStart = _millisecondsInDay - _millisecondsInHalfHour;

  unsigned int _offpeakFinish = 7 * _millisecondsInHour;
  unsigned int _darkperiod = 0;

  int delaySummer = 12 * _millisecondsInHour; // May June July
  int delayLateSummer = 9 * _millisecondsInHour; // August
  int delaySpringFall = 7 * _millisecondsInHour; // March April September
  int delayWinter = 2 * _millisecondsInHour; // January February October November December

  int year = Time.year(_timevalue);
  int month = Time.month(_timevalue);
  int date = Time.day(_timevalue);
  int hour = Time.hour(_timevalue);
  int minute = Time.minute(_timevalue);
  int second = Time.second(_timevalue);


  Serial.print("year: ");
  Serial.println(year);
  Serial.print("month: ");
  Serial.println(month);
  Serial.print("date: ");
  Serial.println(date);
  Serial.print("hour: ");
  Serial.println(hour);
  Serial.print("minute: ");
  Serial.println(minute);
  Serial.print("second: ");
  Serial.println(second);

  int current_time = hour*_millisecondsInHour + minute*60000 + second*_millisecondsInSecond;

  //A second preliminary calculation is made at 1:00 A.M. each day
  //Calculate that day’s sunrise and sunset hours
  // based on the latitude and longitude of the greenhouse and the day of the year.

  Sunrise mySunrise(42,-76,-5);
  mySunrise.Actual();

  int _SR = floor(mySunrise.Rise(month,date)*60*1000);
  int _SS = ceil(mySunrise.Set(month,date)*60*1000);
  int noon = mySunrise.Noon(month, date)*60*1000;
  int _SR_hours = _SR/_millisecondsInHour;
  int _SS_hours = (_SS/_millisecondsInHour)+1;
  int current_time_hours = current_time/_millisecondsInHour;
/*
  Serial.print("Current_time: ");
  Serial.println(current_time);
  Serial.print("Sunrise ms: ");
  Serial.println(_SR);
  Serial.print("Sunset ms: ");
  Serial.println(_SS);
  Serial.print("current hour: ");
  Serial.println(current_time_hours);
  Serial.print("Sunrise Hours: ");
  Serial.println(_SR_hours);
  Serial.print("Sunset Hours: ");
  Serial.println(_SS_hours);
*/
  if (current_time == _SR){
    DLI_counter = 0.0;
    Serial.println("Ran DLI_counter Reset");
  }

  float idealPPFDtoTime = idealPPFDSunriseToTime(_SR,_SS,current_time,DLItarget);
  float idealPPFDtoNoon = idealPPFDSunriseToTime(_SR,_SS,noon,DLItarget);


  float totalDLIdeficit = constrain((DLItarget - DLI_counter), 0.00, DLItarget);
  float currentDLIdeficit = constrain((idealPPFDtoTime - DLI_counter), 0.00, DLItarget);


// this calculation is wrong and should be fixed, specifcially when current_time < sunrise
//  float safetyCheck = lightIntegral_650e(_millisecondsInDay - current_time + _SR);


  //  Serial.print("safety Check: ");
  //  Serial.println(safetyCheck);
/*
  Serial.print("idealPPFDtoTime: ");
  Serial.println(idealPPFDtoTime);
  Serial.print("idealPPFDtoNoon: ");
  Serial.println(idealPPFDtoNoon);
*/
  Serial.print("DLI target: ");
  Serial.println(DLI_counter+totalDLIdeficit);
  Serial.print("DLI_counter: ");
  Serial.println(DLI_counter);
  Serial.print("total DLI deficit: ");
  Serial.println(totalDLIdeficit);
  Serial.print("current DLI deficit: ");
  Serial.println(currentDLIdeficit);
/*
  Serial.print("_offpeakStart: ");
  Serial.println(_offpeakStart);
  Serial.print("_offpeakFinish: ");
  Serial.println(_offpeakFinish);
  Serial.print("_millisecondsInDay: ");
  Serial.println(_millisecondsInDay);
  Serial.print("_darkperiod: ");
  Serial.println(_darkperiod);
*/
  //A preliminary calculation is made only at the first hour of the weather data set:
  //The integrated supplemental PPFD achievable by operating lights during the entire off-peak period
  //(less a possible dark period for photoperiod control).
  // This assumes time-of-day electricity rates do not change during the year.

  unsigned int __milliseconds_offpeak = _milliseconds_offpeak(_offpeakStart,_offpeakFinish,_millisecondsInDay,_darkperiod);
  float supplemental_offpeak_potential = lightIntegral_650e(__milliseconds_offpeak);
  float scaledOffPeakPotential = scale_offpeak_potential(_SR, _SS, current_time)/100.00*supplemental_offpeak_potential;




  //A third preliminary calculation is made for each hour of the weather data set
  //The total (potential) PPFD that could be accumulated using only supplemental lighting
  //if lamps were to be on starting at the beginning of the next hour
  //and remain on until the following sunrise hour or end of the off-peak period
  //(and possibly de-activated for a dark period for photoperiod purposes),
  // whichever comes first.

  unsigned int milliseconds_until_offpeak = __supplemental_PPFD_potential(current_time, _SR, _darkperiod, _offpeakFinish);
  float supplemental_PPFD_potential = lightIntegral_650e(milliseconds_until_offpeak);
/*
  Serial.print("__milliseconds_offpeak: ");
  Serial.println(__milliseconds_offpeak);
  Serial.print("Supplemental off-peak potential: ");
  Serial.println(supplemental_offpeak_potential);
  Serial.print("Scaled off peak potential: ");
  Serial.println(scaledOffPeakPotential);
  Serial.print("milliseconds_until_offpeak: ");
  Serial.println(milliseconds_until_offpeak);
  Serial.print("Supplemental PPFD potential: ");
  Serial.println(supplemental_PPFD_potential);
*/

// RULE 1: If time clock control is included and the current hour is during the period when lamps should be off,
//    control is activated and the lamps are turned off.
//    Time clock control was inactive for everything reported herein.
//    Lettuce was the crop of interest and lettuce needs no dark period to thrive.*/
  if (timeClockOn && (current_time < timeClockStart || current_time > timeClockFinish))
  {
    Serial.println("ran rule 1");
    rule_flag = 1;
    lightOff = true;
    return lightOff;
  }
  else if (timeClockOn && (current_time > timeClockStart || current_time < timeClockFinish))
  {
    Serial.println("ran rule 1");
    rule_flag = 0;
    lightOff = false;
    return lightOff;
  }

  //  RULE 2a: For months of greatest solar irradiation, keep lamps off between sunrise and H1 hours after sunrise.
  // However, if the daily accumulated PPFD is not equal to at least one-quarter of the daily target by solar noon,
  // permit lights to remain on regardless of the value of H1.
  else if ((month == 5 || month == 6 || month == 7) && (current_time > _SR && current_time < ( _SR + delaySummer)))
  {

    if ((current_time >= noon) && (DLI_counter < (0.25 * DLItarget )))
    {
      Serial.println("ran rule 2a");
      rule_flag = 0;
      lightOff = false;
      return lightOff;
    }
    else
    {
      Serial.println("ran rule 2a");
      rule_flag = 2;
      lightOff = true;
      return lightOff;
    }
  }

// RULE 2b:
//  For late summer (when days are still sunny, but solar intensity has lessened),
//  keep lamps off between sunrise and H2 hours after sunrise.
//  However, if the daily accumulated PPFD is not equal to at least one-quarter of the daily target by solar noon,
//  permit lights to remain on regardless of the value of H2
  else if ((month == 8) && (current_time > _SR && current_time < ( _SR + delayLateSummer)))
  {

    if ((current_time >= noon) && (DLI_counter < (0.25 * DLItarget)))
    {
      Serial.println("ran rule 2b");
      rule_flag = 0;
      lightOff = false;
      return lightOff;
    }
    else
    {
      Serial.println("ran rule 2b");
      rule_flag = 3;
      lightOff = true;
      return lightOff;
    }

  }

// RULE 2c: For spring and autumn months, keep lamps off between sunrise and H3 hours after sunrise.
  else if ((month == 3 || month == 4 || month == 9) && ( current_time > _SR && current_time < ( _SR + delaySpringFall) ))
  {
    Serial.println("ran rule 2c");
    rule_flag = 4;
    lightOff = true;
    return lightOff;
  }

//RULE 2D:
//  For the rest of the months of the year,
//  keep lamps off between sunrise and H4 hours after sunrise.
  else if ((month == 1 || month == 2 || month == 10 || month == 11 || month == 12) && ( current_time > _SR && current_time < ( _SR + delayWinter) ))
  {
    Serial.println("ran rule 2d");
    rule_flag = 5;
    lightOff = true;
    return lightOff;
  }

//RULE 3: If solar PPFD accumulated to this hour meets or exceeds the accumulation target (eq. 6) for the hour,
//  turn the lights off. Justification: To this hour, there is no PPFD integral deficit.
  else if (DLI_counter >= idealPPFDtoTime)
  {
    Serial.println("ran rule 3");
    rule_flag = 6;
    lightOff = true;
    return lightOff;
  }

//RULE 4: If: (a) the hour is during the time of year with more sunlight and between sunrise and sunset,
//  (b) the PPFD left to be accumulated can be achieved by delaying supplemental lighting until the next hour even if solar PPFD drops suddenly to insignificance,
//  and the PPFD deficit to this point could be made up by a scaled portion of the off-peak PPFD potential,
//  turn off the lights.
  else if ((month == 5 || month == 6 || month == 7 || month == 8) && (current_time > _SR && current_time < _SS) )
  {
    if ((totalDLIdeficit < supplemental_PPFD_potential) && (currentDLIdeficit < scaledOffPeakPotential))
    {
      Serial.println("ran rule 4");
      rule_flag = 7;
      lightOff = true;
      return lightOff;
    }
  }

//RULE 5: Turn off the lights if the hour is between sunrise and sunset
//  and the PPFD left to be accumulated could be accumulated by turning on the lights at the next hour
//  even if the solar PPFD drops immediately to insignificance and remains there for the rest of the day.
  else if ((current_time > _SR && current_time < _SS) && totalDLIdeficit < supplemental_PPFD_potential)
  {
    Serial.println("ran rule 5");
    rule_flag = 8;
    lightOff = true;
    return lightOff;
  }

//RULE 6: If: (a) the hour is at sunset or between sunset and an hour before the start of off-peak electric rates and
//  (b) the accumulated PPFD deficiency to this hour could be achieved during off-peak hours alone, turn off the lights.
  else if ((current_time >= _SS && current_time < (_offpeakStart - _millisecondsInSecond)) && totalDLIdeficit < supplemental_offpeak_potential)
  {
    Serial.println("ran rule 6");
    rule_flag = 9;
    lightOff = true;
    return lightOff;
  }

//RULE 7: If the hour is before off-peak electric rates start,
//  but any remaining PPFD to be added by supplemental lighting will be achieved before the off-peak period ends,
//  turn off the lights.
  else if (current_time < _offpeakStart && current_time > _offpeakFinish && totalDLIdeficit < supplemental_offpeak_potential)
  {
    Serial.println("ran rule 7");
    rule_flag = 10;
    lightOff = true;
    return lightOff;
  }
//Be sure lights are not turned off
//if the hour is during the dark part of the year
// and there remains more integrated PPFD to be added than can be met by the lamps alone,
// operating from the next hour until the following sunrise
  if ((month == 10 || month == 11 || month == 12 || month == 1 || month == 2) && totalDLIdeficit > supplemental_PPFD_potential )
  {
    Serial.println("ran rule 8");
    rule_flag = 0;
    lightOff = false;
    return lightOff;
  }

}

//=================================================SUPPORT FUNCTIONS

unsigned int seconds_since_start(int _seconds_start) {
  unsigned int seconds_current = Time.local();
  unsigned int time_since_start = seconds_current - _seconds_start;
  return time_since_start;
}

float scale_offpeak_potential (int _SR, int _SS, int _timeT){

  float scale_factor= constrain(((float)map(_timeT, _SR, _SS, 0, 100)), 0, 100);

  return scale_factor;
}

float idealPPFDSunriseToTime(int _SR, int _SS, int _timeT, float _PPFDtarget){
  // Account for hours after sunset and before sunrise
  // during which the ideal DLI to the hour is a function of the previous day.
  if (_timeT >= _SS || _timeT < _SR)
  {
    _timeT = _SS;
  }

  float PPFDintegral = .5 * _PPFDtarget * (1-cos(3.14159*(((float)_timeT-(float)_SR)/((float)_SS-(float)_SR))));

  return PPFDintegral;
}

unsigned int __supplemental_PPFD_potential(int current_time, int _SR, unsigned int darkPeriod, unsigned int offpeakFinish){

  unsigned int hoursTillNextSunrise = 0;
  unsigned int millisecondsInDay = 86400000;
  unsigned int millisecondsInHour = 3600000;

  if ((current_time+1000) > millisecondsInDay){
    current_time += 1000;
  }else{
    current_time = 1000;
  }

  if (_SR < offpeakFinish){

    if (current_time < _SR ) {
      hoursTillNextSunrise = (_SR - current_time) - darkPeriod;
    } else {
      hoursTillNextSunrise = (millisecondsInDay - current_time) + _SR - darkPeriod;
    }

  }else{

    if (current_time < offpeakFinish ) {
      hoursTillNextSunrise = (offpeakFinish - current_time) - darkPeriod;
    } else {
      hoursTillNextSunrise = (millisecondsInDay - current_time) + offpeakFinish - darkPeriod;
    }

  }

  return hoursTillNextSunrise;

}

float lightIntegral_650e (int millisecondsOn){
  int PPFDoutput = 1100;
  int secondsInHour = 3600;
  float avogadros = 1000000.0;
  float millisecondsInHour = 3600000.0;

  return (PPFDoutput*secondsInHour/avogadros)*(millisecondsOn/millisecondsInHour);
}

float milliseconds_PPFD(int millisecondsOn, int PPFD){
  int secondsInHour = 3600;
  float avogadros = 1000000.0;
  float millisecondsInHour = 3600000.0;

  return (PPFD*secondsInHour/avogadros)*((float)millisecondsOn/(float)millisecondsInHour);
}

unsigned int _milliseconds_offpeak(int __offpeakStart,int __offpeakFinish,int __millisecondsInDay,int __darkperiod){
  unsigned int milliseconds_offpeak;

  if (__offpeakFinish > __offpeakStart){
    milliseconds_offpeak = (__offpeakFinish - __offpeakStart) - __darkperiod;
    } else {
      milliseconds_offpeak = ((__millisecondsInDay - __offpeakStart) + __offpeakFinish) - __darkperiod;
    }
    return milliseconds_offpeak;
}

int day365(unsigned long _timevalue){
  int year = Time.year(_timevalue);
  int month = Time.month(_timevalue);
  int day = Time.day(_timevalue);

  int n1 = (275*month/9);
  int n2 = ((month + 9)/12);
  int n3 = (1+(year-4*(year/4+2)/3));
  int n = n1 - (n2*n3) + day - 30;
  //Serial.println(n);
  return n;


}



//===============================================PWM SUPPORT FUNCTIONS
float licor_sensor_PPFD (){
  float sensor_input = analogRead(licor_sensor_pin);
  Serial.print("licor analog read: ");
  Serial.println(sensor_input);
  float volts = (sensor_input*3.3) / 4095.0;
  String _volts(volts,5);
  Serial.print("licor volts: ");
  Serial.println(_volts);
  return volts;
}

float volts_to_micromoles(float volts){
  //====================================CONVERT VOLTS TO MICROMOLES

  float umols = float_map(volts, 0.0, 3.3, 0.0, 2500.00);
  Serial.print("licor umols: ");
  Serial.println(umols);
  return umols;
}

float _PPFD_target (int _photoperiod, float _DLI_target){
  int avogadros = 1000000;
  int seconds = _photoperiod*60*60;
  float PPFD_target = _DLI_target/seconds*avogadros;
  Serial.print("PPFD_target: ");
  Serial.println(PPFD_target);
  return PPFD_target;
}

int light_switch(float umols_actual, float umols_target, float _PPFD_full_power, float _range_min, float _range_max){
  float difference = umols_target - umols_actual;
  Serial.print("difference: ");
  Serial.println(difference);
  float _PWM_control = constrain(float_map(difference, 0.0, _PPFD_full_power, _range_min, _range_max),_range_min,_range_max);
  Serial.print("PWM_control: ");
  Serial.println(_PWM_control);
  return _PWM_control;
}

float float_map(float x, float in_min, float in_max, float out_min, float out_max){
  return (x - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

float low_pass_filter(float _filtered_signal_previous, float _raw_signal){
  float alpha = 0.04;
  float filtered_signal_current = _filtered_signal_previous * (1-alpha) + _raw_signal * alpha;
  filtered_signal_previous = filtered_signal_current;
  return filtered_signal_current;

}

void SdFatWrite(char toWrite[]){
  //
  // if (!Serial.available()){
  //   Serial.println("Type any character to start");
  //   while(!Serial.available()) Particle.process();
  // }
  //
  // open the file for write at end like the "Native SD library"
  if (!myFile.open("test.txt", O_RDWR | O_CREAT | O_AT_END)) {
  //  sd.errorHalt("opening test.txt for write failed");
      Serial.println();
      Serial.println("SDFAT ERROR: open file failed...");
  }

  // if the file opened okay, write to it:
  Serial.print("Writing to test.txt...");
  myFile.println(String(toWrite)+",");
//  myFile.printf("fileSize: %d\n", myFile.fileSize());

  // close the file:
  myFile.close();
  SdFat_reset();
  Serial.println(" done.");

}

void SdFatRead(){

  // re-open the file for reading:
  if (!myFile.open("test.txt", O_READ)) {
    sd.errorHalt("opening test.txt for read failed");
  }
  Serial.println();
  Serial.println("FILE CONTENTS: ");

  // read from the file until there's nothing else in it:
  int data;
  while ((data = myFile.read()) >= 0) {
    Serial.write(data);
  }
  // close the file:
  myFile.close();

}
