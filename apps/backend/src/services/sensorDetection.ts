/**
 * Known I2C sensor addresses and their metadata.
 */
const KNOWN_I2C_SENSORS: Record<number, { name: string; id: string; type: string[] }> = {
    0x76: {
        name: "BME280 / BMP280",
        id: "bme280_0x76",
        type: ["temperature", "humidity", "pressure"],
    },
    0x77: {
        name: "BME280 / BMP280",
        id: "bme280_0x77",
        type: ["temperature", "humidity", "pressure"],
    },
    0x40: { name: "Si7021 / HTU21D", id: "si7021_0x40", type: ["temperature", "humidity"] },
    0x23: { name: "BH1750 Light Sensor", id: "bh1750_0x23", type: ["light"] },
    0x68: { name: "MPU6050", id: "mpu6050_0x68", type: ["motion"] },
    0x1e: { name: "HMC5883L / QMC5883L", id: "compass_0x1e", type: ["magnetometer"] },
};

/**
 * Detects I²C sensors on the Raspberry Pi using the i2c-bus library.
 * Returns detailed sensor info for known devices.
 *
 * @returns {Promise<DetectedSensor[]>}
 */
export async function detectI2CSensors(): Promise<DetectedSensor[]> {
    // @ts-ignore – i2c-bus ist optional
    const i2c = require("i2c-bus");

    try {
        const bus = await i2c.openPromisified(1);
        const devices = await bus.scan();

        return devices.map((addr: number) => {
            const known = KNOWN_I2C_SENSORS[addr];
            return {
                address: addr,
                hex: `0x${addr.toString(16)}`,
                name: known?.name || "Unknown device",
                type: known?.type || [],
                id: known?.id || `i2c_${addr}`,
                isKnown: !!known,
            };
        });
    } catch (error) {
        console.error("Failed to scan I2C devices:", error);
        throw error;
    }
}

/**
 * Type representing a detected I2C sensor with optional classification.
 */
export interface DetectedSensor {
    address: number;
    hex: string;
    name: string;
    id: string;
    type: string[];
    isKnown: boolean;
}
