import { config } from "dotenv"
import { getConfig } from "./utils.js"

config()
export default function setup({ provide: _ }) {
  getConfig()
}
