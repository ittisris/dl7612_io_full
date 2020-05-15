function resetModule () {
    if (input.runningTime() > lastupdated + 60000) {
        lastupdated = input.runningTime()
        serial.writeLine("AT")
        basic.pause(1000)
        serial.writeLine("AT+NRB")
        basic.showLeds(`
            . . . . .
            . # . # .
            . . # . .
            . # . # .
            . . . . .
            `)
    }
    basic.pause(2000)
    basic.clearScreen()
}
serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    rx = serial.readLine()
    rxPayload = cayenneLPP.extractPayloadStr(rx, "+NNMI:", ",")
    if (rxPayload.length > 0) {
        cayenneLPP.lpp_update(rxPayload[1])
    } else {
        rxPayload = cayenneLPP.extractPayloadStr(rx, "+NSMI:", ",")
        if (rxPayload.length > 0) {
            lastupdated = input.runningTime()
            serial.writeLine("AT+SLEEP")
        } else {
            rxPayload = cayenneLPP.extractPayloadStr(rx, "+CGATT:", "")
            if (rxPayload.length > 0) {
                connected = true
                basic.showIcon(IconNames.Yes)
                basic.pause(1000)
                basic.clearScreen()
            }
        }
    }
})
let txPayload = ""
let vBat = 0
let rx = ""
let rxPayload: string[] = []
let connected = false
let lastupdated = 0
led.setBrightness(10)
lastupdated = input.runningTime()
connected = false
rxPayload = []
pins.digitalWritePin(DigitalPin.P0, 0)
cayenneLPP.add_digital(LPP_Direction.Output_Port, DigitalPin.P0)
cayenneLPP.add_sensor(LPP_Bit_Sensor.Temperature)
serial.redirect(
SerialPin.P15,
SerialPin.P14,
BaudRate.BaudRate115200
)
serial.setWriteLinePadding(0)
serial.setRxBufferSize(64)
basic.forever(function () {
    if (input.runningTime() > lastupdated + 120000) {
        connected = false
    }
    if (!(connected)) {
        resetModule()
    } else {
        serial.writeLine("AT")
        vBat = 1.236 / pins.map(
        pins.analogReadPin(AnalogPin.P1),
        0,
        1023,
        0,
        1
        )
        txPayload = "" + cayenneLPP.lpp_upload() + cayenneLPP.lpp(
        LPP_DATA_TYPE.Analog_Input,
        99,
        vBat
        )
        serial.writeLine("AT+NMGS=" + convertToText(txPayload.length / 2) + "," + txPayload)
        basic.pause(10000)
    }
})
