For the PR that was just created - periodically check if bugbot and sonarqube finished running or not every minute or so until they're both done (success or failure).  Ignore the playwright check for now as that's currently too slow to be useful.

And then at that time once both are done, use the gh tool to look for any issues identified. 

If there are no issues, use the GH tool to go ahead and merge the PR. 

If there are issues, take a look at them and review each to make sure it's an actual issue and not overly defensive or other.  Then give me a report sorted by priority 10 = highest to 1 = lowest of all issues and your analysis of the issue and suggested fix. In this case, STOP there and don't merge or anything - wait for me to provide some input and guidance.