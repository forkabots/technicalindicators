/**
 * Created by AAravindan on 5/9/16.
 */
"use strict";

import { ROC } from "./ROC.js";
import { EMA } from "../moving_averages/EMA.js";
import { Indicator, IndicatorInput } from "../indicator/indicator";

export class TRIXInput extends IndicatorInput {
    values: number[];
    period: number;
}

export class TRIX extends Indicator {
    result: number[];
    generator: IterableIterator<number | undefined>;
    constructor(input: TRIXInput) {
        super(input);
        let priceArray = input.values;
        let period = input.period;
        let format = this.format;

        let ema = new EMA({
            period: period,
            values: [],
            format: (v) => {
                return v;
            },
        });
        let emaOfema = new EMA({
            period: period,
            values: [],
            format: (v) => {
                return v;
            },
        });
        let emaOfemaOfema = new EMA({
            period: period,
            values: [],
            format: (v) => {
                return v;
            },
        });
        let trixROC = new ROC({
            period: 1,
            values: [],
            format: (v) => {
                return v;
            },
        });

        this.result = [];

        this.generator = (function* (): IterableIterator<number | undefined> {
            let tick = yield;
            while (true) {
                let initialema = ema.nextValue(tick);
                let smoothedResult = initialema
                    ? emaOfema.nextValue(initialema)
                    : undefined;
                let doubleSmoothedResult = smoothedResult
                    ? emaOfemaOfema.nextValue(smoothedResult)
                    : undefined;
                let result = doubleSmoothedResult
                    ? trixROC.nextValue(doubleSmoothedResult)
                    : undefined;
                tick = yield result ? format(result) : undefined;
            }
        })();

        this.generator.next();

        priceArray.forEach((tick) => {
            let result = this.generator.next(tick as any);
            if (result.value !== undefined) {
                this.result.push(result.value);
            }
        });
    }

    static calculate = trix;

    nextValue(price: number) {
        let nextResult = this.generator.next(price as any);
        if (nextResult.value !== undefined) return nextResult.value;
    }
}

export function trix(input: TRIXInput): number[] {
    Indicator.reverseInputs(input);
    var result = new TRIX(input).result;
    if (input.reversedInput) {
        result.reverse();
    }
    Indicator.reverseInputs(input);
    return result;
}
