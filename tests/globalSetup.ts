import { config } from "dotenv"
import { getConfig } from "./utils.js"

export default function setup({ provide: _ }) {
  config()
  getConfig()
}
