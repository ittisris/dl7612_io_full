function extractPayload (response: string) {
    rxPayload = cayenneLPP.extractPayloadStr(response, "", ":")
    if (rxPayload.length > 0) {
        if ("+NSMI".compare(rxPayload[0]) == 0) {
            if (parseInt(rxPayload[1]) == 1) {
                basic.showIcon(IconNames.Happy)
                connected = true
                lastupdated = input.runningTime()
                serial.writeLine("AT+SLEEP")
            } else {
                basic.showIcon(IconNames.Sad)
            }
        } else {
            if ("+NNMI".compare(rxPayload[0]) == 0) {
                rxPayload = cayenneLPP.extractPayloadStr(response, "", ",")
                if (rxPayload.length > 1) {
                    basic.showArrow(ArrowNames.South)
                    cayenneLPP.lpp_update(rxPayload[1])
                }
            } else {
                if ("+CGATT".compare(rxPayload[0]) == 0) {
                    connected = true
                    lastupdated = input.runningTime()
                    basic.showIcon(IconNames.Heart)
                }
            }
        }
        basic.pause(200)
        basic.clearScreen()
    }
}
function resetModule () {
    if (input.runningTime() > lastupdated + maxDelay) {
        basic.showIcon(IconNames.No)
        lastupdated = input.runningTime()
        serial.writeLine("AT")
        basic.pause(1000)
        serial.writeLine("AT+NRB")
    } else {
        basic.showString("j")
    }
    basic.pause(200)
    basic.clearScreen()
    basic.pause(5000)
}
serial.onDataReceived(serial.delimiters(Delimiters.NewLine), function () {
    rx = serial.readUntil(serial.delimiters(Delimiters.NewLine))
    extractPayload(rx.substr(0, rx.length - 1))
})
let txPayload = ""
let vBat = 0
let rx = ""
let rxPayload: string[] = []
let lastupdated = 0
let maxDelay = 0
let connected = false
led.setBrightness(10)
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
connected = true
let dwellTime = 15000
maxDelay = 120000
let vRef = 1.236
lastupdated = input.runningTime()
basic.forever(function () {
    if (input.runningTime() > lastupdated + maxDelay) {
        connected = false
    }
    if (!(connected)) {
        resetModule()
    } else {
        serial.writeLine("AT")
        images.createImage(`
            . . . . #
            . . . . #
            . . . # #
            . . # # #
            # # # # #
            `).scrollImage(1, 100)
        vBat = vRef / pins.map(
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
        basic.clearScreen()
        basic.pause(dwellTime)
    }
})
