#!/bin/bash

FILE="client/src/pages/BookingFlow.tsx"

# Replace state variable names
sed -i 's/const \[location, setLocation\] = useState("");/const [jobLocation, setJobLocation] = useState("");/' "$FILE"

# Replace references to the state variable (not the hook)
# In createJobRequest body
sed -i 's/location: jobLocation,/jobLocation: jobLocation,/g' "$FILE"
sed -i 's/location, scheduledTime/jobLocation, scheduledTime/g' "$FILE"
sed -i 's/location}/jobLocation}/g' "$FILE"
sed -i 's/location, area/jobLocation, area/g' "$FILE"

# In renderStep2
sed -i 's/value={location}/value={jobLocation}/g' "$FILE"
sed -i 's/onChange={(e) => setLocation(e.target.value)}/onChange={(e) => setJobLocation(e.target.value)}/g' "$FILE"

# In renderStep6
sed -i 's/<strong>Location:<\/strong> {location}/<strong>Location:<\/strong> {jobLocation}/g' "$FILE"

echo "Fixed!"
