#include "SparkJson.h"
TCPClient client;


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
  Time.zone(-5);
  Particle.subscribe("hook-response/DataLogger/0", response, MY_DEVICES);
//=====================================================================TCPClient
while(!Serial.available()) Particle.process();
 Serial.println("connecting...");
 if (client.connect("ec2-54-218-30-22.us-west-2.compute.amazonaws.com", 80))
 {
   Serial.println("connected");
   client.println("GET /assets/2015_GHI_only_short.csv");
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


String json_string;
StaticJsonBuffer<2400> jsonBuffer;

void loop()
{


  JsonArray& root = jsonBuffer.createArray();

  //packet(root);

//===========================================================================LOOPTCP
if (client.available())
  {
    char c = client.read();

    count++;

  }

  if (!client.connected())
  {
    Serial.println();
    Serial.println("disconnecting.");
    client.stop();

    for(;;);
  }
//===========================================================================ENDLOOPTCP
}
