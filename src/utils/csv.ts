import csvToJson from "csvtojson";

export const getJsonFromCSV = async (filePath: string) => {
  const json = await csvToJson({
    trim: true,
  }).fromFile(filePath);
  return json;
};
