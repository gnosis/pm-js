# LMSR Primer

The Gnosis.js implementation of the logarithmic market scoring rule mostly follows the [original specification](http://mason.gmu.edu/~rhanson/mktscore.pdf). It is based on the following cost function:

$$ C(\vec{q}) = b \log \left( \sum_i \exp \left( { q_i \over b } \right) \right) $$

where

* \\(\vec{q}\\) is a vector of *net* quantities of outcome tokens *sold*. What this means is that although the market selling outcome tokens increases the net quantity sold, the market *buying* outcome tokens *decreases* the net quantity sold. 
* \\(b\\) is a liquidity parameter which controls the bounded loss of the LMSR. That bounded loss for the market maker means that the liquidity parameter can be expressed in terms of the number of outcomes and the funding required to guarantee all outcomes sold by the market maker can be backed by collateral (this will be derived later).
* \\(\log\\) and \\(\exp\\) are the natural logarithm and exponential functions respectively

The cost function is used to determine the cost of a transaction in the following way: suppose \\(\vec{q_1}\\) is the state of net quantities sold before the transaction and \\(\vec{q_2}\\) is this state afterwards. Then the cost of the transaction \\(\nu\\) is

$$ \nu = C(\vec{q_2}) - C(\vec{q_1}) $$

For example, suppose there is a LMSR-operated market with a \\(b\\) of 5 and two outcomes. If this market has bought 10 tokens for outcome A and sold 4 tokens for outcome B, it would have a cost level of:

$$ C \begin{pmatrix} -10 \\\\ 4 \end{pmatrix} = 5 \log \left( \exp(-10/5) + \exp(4/5) \right) \approx 4.295 $$

Buying 5 tokens for outcome A (or having the market sell you those tokens) would change the cost level to:

$$ C \begin{pmatrix} -10 + 5 \\\\ 4 \end{pmatrix} = 5 \log \left( \exp(-5/5) + \exp(4/5) \right) \approx 4.765 $$

So the cost of buying 5 tokens for outcome A from this market is:

$$ \nu = C \begin{pmatrix} -5 \\\\ 4 \end{pmatrix} - C \begin{pmatrix} -10 \\\\ 4 \end{pmatrix} \approx 4.765 - 4.295 = 0.470 $$

Similarly, selling 2 tokens for outcome B (or having the market buy those tokens from you) would yield a cost of:

$$ \nu = C \begin{pmatrix} -10 \\\\ 2 \end{pmatrix} - C \begin{pmatrix} -10 \\\\ 4 \end{pmatrix} \approx -1.861 $$

That is to say, the market will buy 2 tokens of outcome B for 1.861 units of collateral.

## Bounded Loss from the \\(b\\) Parameter

Here is the worst scenario for the market maker: everybody but the market maker already knows which one of the \\(n\\) outcomes will occur. Without loss of generality, let the answer be the first outcome token. Everybody buys outcome one tokens from the market maker while selling off every other worthless outcome token they hold. The cost function for the market maker goes from

$$ C \begin{pmatrix} 0 \\\\ 0 \\\\ 0 \\\\ \vdots \end{pmatrix} = b \log n $$

to

$$ C \begin{pmatrix} q_1 \\\\ -\infty \\\\ -\infty \\\\ \vdots \end{pmatrix} = b \log \left( \exp \left( {q_1 \over b} \right) \right) = q_1 $$

The market sells \\(q_1\\) shares of outcome one and buys shares for every other outcome until those outcome tokens become worthless to the market maker. This costs the participants \\((q_1 - b \log n)\\) in collateral, and thus, when the participants gain \\(q_1\\) from redeeming their winnings, this nets the participants \\((b \log n)\\) in collateral. This gain for the participant is equal to the market's loss.

Thus, in order to guarantee that a market can operate with a liquidity parameter of \\(b\\), it must be funded with \\((F = b \log n)\\) of collateral. Another way to look at this is that the market's funding determines its \\(b\\) parameter:

$$ b = {F \over \log n} $$

In the Gnosis implementation, the [LMSR market maker contract](https://gnosis-contracts.readthedocs.io/en/latest/LMSRMarketMaker.html) is provided with the `funding` \\(F\\) through inspection of the `market`, and \\(b\\) is derived accordingly.

## Marginal Price of Outcome Tokens

Because the cost function is nonlinear, there isn't a price for outcome tokens which scales with the quantity being purchased. However, the cost function *is* differentiable, so a marginal price can be quoted for infinitesimal quantities of outcome tokens:

$$ P_i = {\partial C(\vec{q}) \over \partial q_i} = \frac{\exp(q_i / b)}{\sum_k \exp(q_k / b)} $$

In the context of prediction markets, this marginal price can also be interpreted as the market's estimation of the odds of that outcome occurring.

## LMSR Calculation Functions

The functions [Gnosis.calcLMSRCost](api-reference.html#calcLMSRCost) and [Gnosis.calcLMSRProfit](api-reference.html#calcLMSRProfit) estimate the cost of buying outcome tokens and the profit from selling outcome tokens respectively. The [Gnosis.calcLMSROutcomeTokenCount](api-reference.html#calcLMSROutcomeTokenCount) estimates the quantity of an outcome token which can be bought given an amount of collateral and serves as a sort of "inverse calculation" to Gnosis.calcLMSRCost. Finally, [Gnosis.calcLMSRMarginalPrice](api-reference.html#calcLMSRMarginalPrice) can be used to get the marginal price of an outcome token.
