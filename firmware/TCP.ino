#include "SparkJson.h"
#include "math.h"
#include "Sunrise.h"


TCPClient client;
// Buffer for the incoming data
bool record = false;
char inChar[1000];
int j = 0;
int runFlag = 1;
char next[50] = "GET /assets/2015_1_3_0.json";
unsigned long check_date = 1111111111;
float DLI = 0.0;

// Storage for data as string
String inString = "";

void packet (JsonArray& root){
  int i=0;
while (i<6){
  JsonObject& data = root.createNestedObject();
  data["T"] = Time.local();
  data["L"] = "1.001";
  data["E"] = "1.001";
  i++;
  delay(1000);
  }
  i = 0;
//  root.printTo(Serial);
  char buffer[1100];
  root.printTo((char *)buffer, sizeof(buffer));
  //Serial.print(buffer);
  Particle.publish("DataLogger",(const char *)buffer,PRIVATE);
}

void setup()
{
  // Make sure your Serial Terminal app is closed before powering your device
  Serial.begin(9600);
  Particle.syncTime();
//  Time.zone(-5);
  Particle.subscribe("hook-response/DataLogger/0", response, MY_DEVICES);

//=====================================================================TCPClient
while(!Serial.available()) Particle.process();
 Serial.println("connecting...");
 if (client.connect("ec2-54-218-30-22.us-west-2.compute.amazonaws.com", 80))
 {
   Serial.println("connected");
   Serial.println();
   client.println("GET /assets/2015_1_3_1.json");
   client.println("Host: ec2-54-218-30-22.us-west-2.compute.amazonaws.com");
   client.println("Content-Length: 0");
   client.println(); // send msg

 }
 else
 {
   Serial.println("connection failed");
 }
 //===========================================================================endTCP

}

void response(const char *event, const char *data){
  Serial.println(data);
}

void loop()
{

/*
  JsonArray& root = jsonBuffer.createArray();
  //packet(root);
*/
//serialEvent();
if (!client.connected() && runFlag > 0 ){
  record = false;
  bool timeClockOn = false;
  int timeClockStart = 7*3600000;
  int timeClockFinish = 23*3600000;




  const int bufferSize = JSON_ARRAY_SIZE(24) + 24*JSON_OBJECT_SIZE(2);
  StaticJsonBuffer<bufferSize> jsonBuffer;
  JsonArray& tree = jsonBuffer.parseArray(inChar);

  Serial.println();
  LASSI(tree,timeClockOn, timeClockStart, timeClockFinish);



  Serial.println();
  Serial.println("disconnected.");
  client.stop();


// reinitialize inchar array
  j=0;
  for (int k = 0; k<sizeof(inChar); k++){
    inChar[k]='\0';
  };
  //change back to -1
  runFlag*=-1;

} else if (!client.connected() && runFlag < 0 ){
//change to false
  record = false;

   if (client.connect("ec2-54-218-30-22.us-west-2.compute.amazonaws.com", 80))
   {
     Serial.println("connected_loop");
     Serial.println();
     client.println(next);
     client.println("Host: ec2-54-218-30-22.us-west-2.compute.amazonaws.com");
     client.println("Content-Length: 0");
     client.println(); // send msg

   }
   else
   {
     Serial.println("connection failed");
   }

    runFlag*=-1;
  }

if (client.available())
{
  char c = client.read();

  if (c == '[') {record = true; }
  if (record){
  //  Serial.print(c);
   //inString += c;
  inChar[j] = c;
  j++;
}

}

}

void LASSI(JsonArray& root, bool timeClockOn, int timeClockStart, int timeClockFinish){

  int millisecondsOn = 0;

  root.printTo(Serial);
  Serial.println();

 for (int i =0;i<root.size();i++){

   // root[i].printTo(Serial);
     String t = root[i]["T"].asString();
     char inputStr[11];
     t.toCharArray(inputStr,11);
     unsigned long timevalue = atoi(inputStr);

      String l = root[i]["L"].asString();
      char input[7];
      l.toCharArray(input,7);
      float PPFD = atof(input);


      if ( !(  (Time.year(timevalue)==Time.year(check_date)) && (Time.month(timevalue)==Time.month(check_date)) && (Time.day(timevalue)==Time.day(check_date))      ) )
        {

         Serial.println("ran PPFD reset");

          check_date = timevalue;
          DLI = 4.5;

        } else
        {
          DLI += half_hour_PPFD_to_DLI(PPFD);

        }

  //  millisecondsOn += 1800000;

  //  Serial.println(timeClockOn);
    //Serial.println(lightIntegral_650e(86400000));

  if (algorithm(timevalue, PPFD, timeClockOn, timeClockStart, timeClockFinish, DLI)){
    Serial.println(Time.hour(timevalue));
    Serial.println("Lights off");
    Serial.print("DLI: ");
    Serial.println(DLI);

  } else {
    Serial.println(Time.hour(timevalue));
    Serial.println("Lights on");
    Serial.print("Light contribution: ");
    Serial.println(lightIntegral_650e(1800000));
    DLI += lightIntegral_650e(1800000);
    Serial.print("DLI: ");
    Serial.println(DLI);
  };

 }
 Serial.print("DLI: ");
 Serial.println(DLI);
 }

bool algorithm(long _timevalue, float _PPFD, bool timeClockOn, int timeClockStart, int timeClockFinish, float _DLI){
  bool lightOff = true;

  float latitude = 42.443961;
  float longitude = -76.501881;

  unsigned int _millisecondsInDay = 86400000;
  unsigned int _offpeakStart = 84600000;

  unsigned int _offpeakFinish = 7 * 3600000;
  unsigned int _darkperiod = 0;

  int delaySummer = 12 * 3600000; // May June July
  int delayLateSummer = 9 * 3600000; // August
  int delaySpringFall = 7 * 3600000; // March April September
  int delayWinter = 2 * 3600000; // January February October November December

  int year = Time.year(_timevalue);
  int month = Time.month(_timevalue);
  int date = Time.day(_timevalue);
  int hour = Time.hour(_timevalue);
  int minute = Time.minute(_timevalue);
  int second = Time.second(_timevalue);

  int current_time = hour*3600000 + minute*60*1000 + second*1000;

  //A second preliminary calculation is made at 1:00 A.M. each day
  //Calculate that day’s sunrise and sunset hours
  // based on the latitude and longitude of the greenhouse and the day of the year.
  Sunrise mySunrise(42,-76,-5);
  mySunrise.Actual();
  int _SR = floor(mySunrise.Rise(month,date)*60*1000);
  int _SS = ceil(mySunrise.Set(month,date)*60*1000);
  int noon = mySunrise.Noon(month, date)*60*1000;

  // DLI RESET
  if (current_time/1800000 == _SR/1800000)
  {
    DLI = 0.0;
  }

  float DLItarget = 17.0;
  float idealPPFDtoTime = idealPPFDSunriseToTime(_SR/3600000,_SS/3600000,current_time/3600000,DLItarget);
  float idealPPFDtoNoon = idealPPFDSunriseToTime(_SR/3600000,_SS/3600000,noon/3600000,DLItarget);
  float totalDLIdeficit = constrain((DLItarget - DLI), 0.00, DLItarget);
  float currentDLIdeficit = constrain((idealPPFDtoTime - _DLI), 0.00, DLItarget);

  float safetyCheck = lightIntegral_650e(_millisecondsInDay - current_time + _SR);
//  Serial.print("safety Check: ");
//  Serial.println(safetyCheck);
  Serial.print("total DLI deficit: ");
  Serial.println(totalDLIdeficit);
  Serial.print("current DLI deficit: ");
  Serial.println(currentDLIdeficit);
  Serial.print("idealPPFDSunriseToTime: ");
  Serial.println(idealPPFDtoTime);

//  Serial.println(DLItarget);

//A preliminary calculation is made only at the first hour of the weather data set:
//The integrated supplemental PPFD achievable by operating lights during the entire off-peak period
//(less a possible dark period for photoperiod control).
// This assumes time-of-day electricity rates do not change during the year.

  float supplemental_offpeak_potential = lightIntegral_650e(_supplemental_PPFD_offpeak(_offpeakStart,_offpeakFinish,_millisecondsInDay,_darkperiod));
  float scaledOffPeakPotential = scale_offpeak_potential(_SR/3600000, _SS/3600000, current_time/3600000)/100.00*supplemental_offpeak_potential;
//  Serial.print("Scaled off peak potential: ");
//  Serial.println(scaledOffPeakPotential);
  Serial.print("Supplemental off-peak potential: ");
  Serial.println(supplemental_offpeak_potential);
//A third preliminary calculation is made for each hour of the weather data set
//The total (potential) PPFD that could be accumulated using only supplemental lighting
//if lamps were to be on starting at the beginning of the next hour
//and remain on until the following sunrise hour or end of the off-peak period
//(and possibly de-activated for a dark period for photoperiod purposes),
// whichever comes first.
  float supplemental_PPFD_potential = lightIntegral_650e(_supplemental_PPFD_potential(current_time, _SR, _millisecondsInDay, _offpeakFinish, _darkperiod));
//  Serial.print("Supplemental PPFD potential: ");
//  Serial.println(supplemental_PPFD_potential);

//RULE 1: If time clock control is included and the current hour is during the period when lamps should be off,
// control is activated and the lamps are turned off.
//Time clock control was inactive for everything reported herein.
//Lettuce was the crop of interest and lettuce needs no dark period to thrive.
  if (timeClockOn && (current_time < timeClockStart || current_time > timeClockFinish))
  {
    Serial.println("ran rule 1");
    lightOff = true;
    return lightOff;
  }
  else if (timeClockOn && (current_time > timeClockStart || current_time < timeClockFinish))
  {
    Serial.println("ran rule 1");
    lightOff = false;
    return lightOff;
  }

  //  RULE 2a: For months of greatest solar irradiation, keep lamps off between sunrise and H1 hours after sunrise.
  // However, if the daily accumulated PPFD is not equal to at least one-quarter of the daily target by solar noon,
  // permit lights to remain on regardless of the value of H1.
  else if ((month == 5 || month == 6 || month == 7) && (current_time > _SR && current_time < ( _SR + delaySummer)))
  {

    if ((current_time >= noon) && (_DLI < (.25 * idealPPFDtoNoon )))
    {
      Serial.println("ran rule 2a");
      lightOff = false;
      return lightOff;
    }
    else
    {
      Serial.println("ran rule 2a");
      lightOff = true;
      return lightOff;
    }
  }
  /* RULE 2b:
  For late summer (when days are still sunny, but solar intensity has lessened),
   keep lamps off between sunrise and H2 hours after sunrise.
   However, if the daily accumulated PPFD is not equal to at least one-quarter of the daily target by solar noon,
   permit lights to remain on regardless of the value of H2
   */

  else if ((month == 8) && (current_time > _SR && current_time < ( _SR + delayLateSummer)))
  {

    if ((current_time >= noon) && (_DLI < (.25 * idealPPFDtoNoon)))
    {
      Serial.println("ran rule 2b");
      lightOff = false;
      return lightOff;
    }
    else
    {
      Serial.println("ran rule 2b");
      lightOff = true;
      return lightOff;
    }

  }

  /* RULE 2c: For spring and autumn months, keep lamps off between sunrise and H3 hours after sunrise.*/

  else if ((month == 3 || month == 4 || month == 9) && ( current_time > _SR && current_time < ( _SR + delaySpringFall) ))
  {
    Serial.println("ran rule 2c");
    lightOff = true;
    return lightOff;
  }
/*RULE 2D:
For the rest of the months of the year,
 keep lamps off between sunrise and H4 hours after sunrise.
 */
  else if ((month == 1 || month == 2 || month == 10 || month == 11 || month == 12) && ( current_time > _SR && current_time < ( _SR + delayWinter) ))
  {
    Serial.println("ran rule 2d");
    lightOff = true;
    return lightOff;
  }
/*RULE 3: If solar PPFD accumulated to this hour meets or exceeds the accumulation target (eq. 6) for the hour,
 turn the lights off. Justification: To this hour, there is no PPFD integral deficit.
 */
 else if (_DLI >= idealPPFDtoTime)
 {
   Serial.println("ran rule 3");
   lightOff = true;
   return lightOff;
 }
/*RULE 4: If: (a) the hour is during the time of year with more sunlight and between sunrise and sunset,
(b) the PPFD left to be accumulated can be achieved by delaying supplemental lighting until the next hour even if solar PPFD drops suddenly to insignificance,
and the PPFD deficit to this point could be made up by a scaled portion of the off-peak PPFD potential,
turn off the lights. The off-peak PPFD potential is scaled so decisions during the early hours of the solar day are not based on an expectation of using all
the off-peak PPFD potential to make up for the current deficit,
saving none to make up for deficits during later hours.
The scaling function used in the program was a multiplying sine function that rose from a zero value at sunrise to unity at sunset.
A linear rise (ramp) may have done as well.
*/
 else if ((month == 5 || month == 6 || month == 7 || month == 8) && current_time > _SR && current_time < _SS )
 {
   if ((totalDLIdeficit < supplemental_PPFD_potential) && (currentDLIdeficit < scaledOffPeakPotential))
   {
     Serial.println("ran rule 4");
     lightOff = true;
     return lightOff;
   }
 }

 /*RULE 5: Turn off the lights if the hour is between sunrise and sunset
 and the PPFD left to be accumulated could be accumulated by turning on the lights at the next hour
 even if the solar PPFD drops immediately to insignificance and remains there for the rest of the day.*/
 else if (current_time > _SR && current_time < _SS && totalDLIdeficit < supplemental_PPFD_potential)
 {
   Serial.println("ran rule 5");
   lightOff = true;
   return lightOff;
 }

/*RULE 6: If: (a) the hour is at sunset or between sunset and an hour before the start of off-peak electric rates and
(b) the accumulated PPFD deficiency to this hour could be achieved during off-peak hours alone, turn off the lights.*/
 else if ((current_time > _SS && current_time < (_offpeakStart - 3600000)) && totalDLIdeficit < supplemental_offpeak_potential)
 {
   Serial.println("ran rule 6");
   lightOff = true;
   return lightOff;
 }

/*RULE 7: If the hour is before off-peak electric rates start,
but any remaining PPFD to be added by supplemental lighting will be achieved before the off-peak period ends,
turn off the lights.*/
 else if (current_time < _offpeakStart && current_time > _offpeakFinish && totalDLIdeficit < supplemental_offpeak_potential)
 {
   Serial.println("ran rule 7");
   lightOff = true;
   return lightOff;
 }

 if ((month == 10 || month == 11 || month == 12 || month == 1 || month == 2) && totalDLIdeficit > safetyCheck )
 {
   Serial.println("ran rule 8");
   lightOff = false;
   return lightOff;
 }


}


float scale_offpeak_potential (int _SR, int _SS, int _timeT){
/*  Serial.print("Sunrise: ");
  Serial.println(_SR);
  Serial.print("Sunset: ");
  Serial.println(_SS);
  Serial.print("Current Time: ");
  Serial.println(_timeT);*/
  float scale_factor= constrain(((float)map(_timeT, _SR, _SS, 0, 100)), 0, 100);
//  Serial.print("scale_factor: ");
//  Serial.println(scale_factor);
  return scale_factor;
}
float idealPPFDSunriseToTime(int _SR, int _SS, int _timeT, int _PPFDtarget){

// Account for hours after sunset and before sunrise
// during which the ideal DLI to the hour is a function of the previous day.
  if (_timeT >= _SS || _timeT < _SR)
  {
    _timeT = _SS;
  }

  float PPFDintegral = .5 * (float)_PPFDtarget * (1-cos(3.14159*(((float)_timeT-(float)_SR)/((float)_SS-(float)_SR))));
  return PPFDintegral;
}

unsigned int _supplemental_PPFD_potential(int current_time, int _SR, int _millisecondsInDay, int _offpeakFinish, int _darkperiod){
  unsigned int _supplemental_PPFD_potential;

  if (current_time%1800000 == 0) {
      current_time += 1800000;
    } else {
      current_time = ceil(current_time/1800000.0) * 1800000;
    }

  if ( current_time < _SR) {
      _supplemental_PPFD_potential = constrain(((_SR - current_time) - _darkperiod), 0, (_SR - current_time));

    } else if (_darkperiod > (_SR - _offpeakFinish)){
      _supplemental_PPFD_potential = ((_millisecondsInDay - current_time) + _SR) - _darkperiod;

  } else {
      _supplemental_PPFD_potential = (_millisecondsInDay - current_time) + _offpeakFinish;

  }

  return _supplemental_PPFD_potential;
}

float lightIntegral_650e (int millisecondsOn){
  int PPFDoutput = 1100;
  int secondsInHour = 3600;
  float avogadros = 1000000.0;
  float millisecondsInHour = 3600000.0;

  return PPFDoutput*secondsInHour/avogadros*(millisecondsOn/millisecondsInHour);
}

float half_hour_PPFD_to_DLI (float PPFDintegral)
{
    int secondsInHalfHour = 60*30;
    float avogadros = 1000000.0;


    return PPFDintegral*secondsInHalfHour/avogadros;
}

unsigned int _supplemental_PPFD_offpeak(int __offpeakStart,int __offpeakFinish,int __millisecondsInDay,int __darkperiod){
  unsigned int _supplemental_offpeak;

  if (__offpeakFinish > __offpeakStart){
      _supplemental_offpeak = (__offpeakFinish - __offpeakStart) - __darkperiod;
    } else {
      _supplemental_offpeak = ((__millisecondsInDay - __offpeakStart) + __offpeakFinish) - __darkperiod;
  }
  return _supplemental_offpeak;
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
