import {
  Heading,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Button,
  Stat,
  StatGroup,
  StatLabel,
  StatNumber,
  StatHelpText,
  Card,
  CardBody,
  HStack,
  Icon,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import { AiOutlineClockCircle } from 'react-icons/ai';
import { GoGitPullRequest } from 'react-icons/go';
import { TbPackages, TbCrystalBall } from 'react-icons/tb';

function MergeQueueCalculator() {
  const [ciTime, setCiTime] = useState(30);
  const [prPerHour, setPrPerHour] = useState(10);
  const [ciUsagePct, setCiUsagePct] = useState(100);
  const [successRatio, setSuccessRatio] = useState(98);
  const [throughput, setThroughput] = useState(null);
  const [speculativeChecks, setSpeculativeChecks] = useState(null);
  const [batchSize, setBatchSize] = useState(null);
  const [latency, setLatency] = useState(null);

  const calculate = () => {
    const calculatedBatchSize = Math.ceil(100 / ciUsagePct);
    const ciTimeWithFailure = ciTime * (1 + ((100 - successRatio) / 100));
    let calculatedSpeculativeChecks = (
      prPerHour / (60 / ciTimeWithFailure) / calculatedBatchSize
    );

    if (batchSize === 1) calculatedSpeculativeChecks *= ciUsagePct / 100;

    calculatedSpeculativeChecks = Math.ceil(calculatedSpeculativeChecks);

    const calculatedThroughput = (
      (calculatedBatchSize * calculatedSpeculativeChecks) / (ciTime / 60)
    );

    setSpeculativeChecks(calculatedSpeculativeChecks);
    setBatchSize(calculatedBatchSize);
    setThroughput(Math.floor(calculatedThroughput));
    setLatency(Math.ceil(Math.max(ciTimeWithFailure, 30 * (prPerHour / calculatedThroughput))));
  };

  return (
    <FormControl>
      <Heading as="h2" marginBottom="1em">Merge Queue Performance Settings</Heading>
      <HStack>
        <FormLabel>
          CI time in minutes:
          <NumberInput defaultValue={ciTime} min={0} onChange={(e) => setCiTime(e)}>
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormLabel>
        <FormLabel>
          Estimated CI success ratio in %:
          <NumberInput
            defaultValue={successRatio}
            min={1}
            max={100}
            onChange={(e) => setSuccessRatio(e)}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormLabel>
        <FormLabel>
          Desired PR merges per hour:
          <NumberInput defaultValue={prPerHour} min={1} onChange={(e) => setPrPerHour(e)}>
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormLabel>
        <FormLabel>
          Desired CI usage in %:
          <NumberInput defaultValue={ciUsagePct} min={1} onChange={(e) => setCiUsagePct(e)}>
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>
        </FormLabel>
        <Button colorScheme="blue" style={{ paddingLeft: '2em', paddingRight: '2em' }} size="md" onClick={calculate}>Calculate</Button>
      </HStack>

      {throughput && (
        <Card>
          <CardBody>
            <StatGroup>
              <Stat>
                <StatLabel><Icon as={TbCrystalBall} /> Optimal speculative checks</StatLabel>
                <StatNumber>{speculativeChecks}</StatNumber>
                <StatHelpText>PR tested concurrently</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel><Icon as={TbPackages} /> Optimal batch size</StatLabel>
                <StatNumber>{batchSize}</StatNumber>
                <StatHelpText>PR per batch</StatHelpText>
              </Stat>
            </StatGroup>
            <StatGroup>
              <Stat>
                <StatLabel><Icon as={GoGitPullRequest} /> Maximum throughput</StatLabel>
                <StatNumber>{throughput}</StatNumber>
                <StatHelpText>PR merged / hour</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel><Icon as={AiOutlineClockCircle} /> Average latency</StatLabel>
                <StatNumber>{latency}</StatNumber>
                <StatHelpText>minutes before merge</StatHelpText>
              </Stat>
            </StatGroup>
          </CardBody>
        </Card>
      )}
    </FormControl>
  );
}

export default MergeQueueCalculator;
